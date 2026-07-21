const db = require('../config/db');
const axios = require('axios');
const FormData = require('form-data');
const logger = require('../utils/logger');
const { uploadFile, getObjectStream } = require('./storage.service');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

class LibraryService {
  // ── Knowledge Library items (papers / datasets / notes / literature reviews) ──

  /**
   * Create a library item. If a PDF is uploaded it is stored in S3/MinIO AND
   * sent to the ML service for text extraction (auto-filling title/abstract and
   * capturing the full text). The item is then indexed into ES `papers` for
   * semantic full-text search (fire-and-forget).
   */
  async createItem(userId, data, file = null) {
    let { item_type = 'paper', title, abstract, authors, doi, tags } = data;
    const validTypes = ['paper', 'dataset', 'note', 'literature_review'];
    const type = validTypes.includes(item_type) ? item_type : 'paper';

    let storageKey = null, fileUrl = null, fullText = null;

    // Extract text from an uploaded PDF (auto-fills metadata + full text)
    if (file && (file.mimetype === 'application/pdf' || (file.originalname || '').toLowerCase().endsWith('.pdf'))) {
      try {
        const extracted = await this._extractPdf(file);
        fullText = extracted.full_text || null;
        if (!title && extracted.title) title = extracted.title;
        if (!abstract && extracted.abstract) abstract = extracted.abstract;
      } catch (e) {
        logger.warn(`[Library] PDF extraction failed: ${e.message}`);
      }
    }

    if (!title) { const e = new Error('title is required'); e.status = 400; throw e; }

    if (file) {
      fileUrl = await uploadFile(file, 'library');
      storageKey = fileUrl.split(`/${require('../config').s3.bucket}/`).pop();
    }

    const result = await db.query(
      `INSERT INTO library_items (user_id, item_type, title, abstract, authors, doi, tags, storage_key, file_url, full_text)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [userId, type, title, abstract || null, authors || null, doi || null,
       JSON.stringify(Array.isArray(tags) ? tags : []), storageKey, fileUrl, fullText]
    );
    const item = result.rows[0];

    // Feed the recommender + semantic index (fire-and-forget)
    this._indexItem(item).catch((e) => logger.warn(`[Library] index item failed: ${e.message}`));

    // Module 8: publication_update notification when a paper is added
    if (type === 'paper') {
      try {
        const notificationService = require('./notification.service');
        await notificationService.notify(userId, 'publication_update',
          'Publication added', `"${title}" was added to your library.`, { library_item_id: item.id });
      } catch (e) { logger.warn(`[Library] publication_update notify failed: ${e.message}`); }
    }
    return item;
  }

  /** Send a PDF buffer to the ML service and return { title, abstract, full_text }. */
  async _extractPdf(file) {
    const form = new FormData();
    form.append('file', file.buffer, { filename: file.originalname || 'document.pdf', contentType: 'application/pdf' });
    const res = await axios.post(`${ML_SERVICE_URL}/library/extract-pdf`, form, {
      headers: { ...form.getHeaders() }, timeout: 60000, maxContentLength: Infinity, maxBodyLength: Infinity,
    });
    return res.data || {};
  }

  async listItems(userId, itemType = null) {
    const params = [userId];
    let where = 'WHERE user_id = $1';
    if (itemType) { params.push(itemType); where += ` AND item_type = $${params.length}`; }
    const result = await db.query(
      `SELECT id, user_id, item_type, title, abstract, authors, doi, tags, file_url, created_at
         FROM library_items ${where} ORDER BY created_at DESC`, params);
    return result.rows;
  }

  /**
   * Discover shared library content across ALL users (the "discover" half of the
   * shared repository). Uses semantic full-text ES search when a query is given,
   * otherwise a recency browse. Results include the owner's name.
   */
  async discoverItems({ q = '', type = null, limit = 20 } = {}) {
    if (q && q.trim()) {
      const hits = await this.searchItems(q.trim(), limit, { itemType: type });
      return hits; // already hydrated with owner + metadata
    }
    // Browse (no query): recent shared items, optionally by type
    const params = [];
    const where = ['li.is_shared IS NOT FALSE'];
    if (type) { params.push(type); where.push(`li.item_type = $${params.length}`); }
    params.push(Math.min(limit, 50));
    const result = await db.query(
      `SELECT li.id, li.user_id, li.item_type, li.title, li.abstract, li.authors, li.doi,
              li.tags, li.file_url, li.created_at, u.name AS owner_name
         FROM library_items li JOIN users u ON li.user_id = u.id
        WHERE ${where.join(' AND ')}
        ORDER BY li.created_at DESC LIMIT $${params.length}`, params);
    return result.rows;
  }

  /** Embed a library item (title + abstract + full text) and index into ES `papers`. */
  async _indexItem(item) {
    // SBERT truncates long input; include a slice of full_text so the vector reflects content
    const text = [item.title, item.abstract, item.authors, (item.full_text || '').slice(0, 4000)]
      .filter(Boolean).join('. ');
    let embedding = null;
    try {
      const res = await axios.post(`${ML_SERVICE_URL}/embed`, { text }, { timeout: 30000 });
      embedding = res.data?.embedding || res.data?.vectors || null;
    } catch (e) { logger.warn(`[Library] embed item ${item.id} failed: ${e.message}`); }
    const { getEsClient } = require('../config/elasticsearch');
    const document = {
      title: item.title || '', abstract: item.abstract || '',
      full_text: item.full_text || '',
      authors: item.authors || '', tags: Array.isArray(item.tags) ? item.tags : [],
      item_type: item.item_type || 'paper', doi: item.doi || null, user_id: item.user_id,
    };
    if (Array.isArray(embedding) && embedding.length > 0) document.embedding = embedding;
    await getEsClient().index({ index: 'papers', id: String(item.id), document });
  }

  /**
   * Semantic + full-text search over the library `papers` index.
   * Results are hydrated from PG with owner name + file_url.
   */
  async searchItems(queryText, limit = 20, { itemType = null } = {}) {
    const { getEsClient } = require('../config/elasticsearch');
    const es = getEsClient();
    let vector = null;
    if (queryText) {
      try {
        const res = await axios.post(`${ML_SERVICE_URL}/embed`, { text: queryText }, { timeout: 30000 });
        vector = res.data?.embedding || res.data?.vectors || null;
      } catch (_) { /* fall back to keyword-only */ }
    }
    const filter = itemType ? [{ term: { item_type: itemType } }] : [];
    const body = {
      size: limit,
      query: queryText
        ? { bool: { must: [{ multi_match: { query: queryText, fields: ['title^2', 'abstract', 'full_text', 'authors'] } }], filter } }
        : { bool: { must: [{ match_all: {} }], filter } },
    };
    if (Array.isArray(vector) && vector.length > 0) {
      body.knn = { field: 'embedding', query_vector: vector, k: limit, num_candidates: 100, filter: filter.length ? filter : undefined };
    }
    let hits = [];
    try {
      const resp = await es.search({ index: 'papers', body });
      hits = resp.hits.hits.map((h) => ({ id: h._id, _score: h._score, ...h._source }));
    } catch (e) {
      logger.warn(`[Library] ES search failed: ${e.message}`);
      return [];
    }
    // Hydrate owner name + file_url from PG (ES doesn't store those)
    const ids = hits.map((h) => parseInt(h.id)).filter(Number.isFinite);
    if (ids.length === 0) return hits;
    const meta = await db.query(
      `SELECT li.id, li.file_url, u.name AS owner_name
         FROM library_items li JOIN users u ON li.user_id = u.id WHERE li.id = ANY($1)`, [ids]
    ).catch(() => ({ rows: [] }));
    const byId = new Map(meta.rows.map((r) => [String(r.id), r]));
    return hits.map((h) => ({ ...h, ...(byId.get(String(h.id)) || {}) }));
  }

  /** Fetch a library item's stored file for download (streamed through the backend). */
  async getItemFile(itemId, userId) {
    const res = await db.query(
      `SELECT storage_key, title, file_url, user_id, is_shared FROM library_items WHERE id = $1`, [itemId]);
    if (res.rows.length === 0) { const e = new Error('Item not found'); e.status = 404; throw e; }
    const item = res.rows[0];
    // owner can always download; others only if shared
    if (item.user_id !== userId && item.is_shared === false) {
      const e = new Error('Not authorized'); e.status = 403; throw e;
    }
    if (!item.storage_key) { const e = new Error('No file attached to this item'); e.status = 404; throw e; }
    const obj = await getObjectStream(item.storage_key);
    return { ...obj, filename: (item.title || 'document').replace(/[^a-z0-9._-]+/gi, '_') + '.pdf' };
  }

  async searchJournals(filters) {
    const { 
      query, 
      category, 
      tier, 
      year, 
      page = 1, 
      limit = 50,
      isOpenAccess,
      region
    } = filters;

    let whereClauses = ['1=1'];
    const params = [];
    let paramCount = 1;

    if (query) {
      whereClauses.push(`(name ILIKE $${paramCount} OR issn ILIKE $${paramCount} OR publisher ILIKE $${paramCount})`);
      params.push(`%${query}%`);
      paramCount++;
    }

    if (category) {
      whereClauses.push(`category = $${paramCount}`);
      params.push(category);
      paramCount++;
    }

    if (tier) {
      whereClauses.push(`quality_tier = $${paramCount}`);
      params.push(tier);
      paramCount++;
    }

    if (year) {
      whereClauses.push(`year = $${paramCount}`);
      params.push(year);
      paramCount++;
    }

    if (isOpenAccess === 'true') {
      whereClauses.push(`is_open_access = true`);
    }

    if (region) {
      whereClauses.push(`region = $${paramCount}`);
      params.push(region);
      paramCount++;
    }

    const where = whereClauses.join(' AND ');

    // 1. Get Total Count (Faster than Window Function for large tables)
    const countSql = `SELECT COUNT(*) FROM journals WHERE ${where}`;
    const { rows: countRows } = await db.query(countSql, params);
    const totalCount = parseInt(countRows[0].count);

    if (totalCount === 0) {
      return { journals: [], totalCount: 0, page: parseInt(page), limit: parseInt(limit), totalPages: 0 };
    }

    // 2. Get Paginated Data
    const offset = (page - 1) * limit;
    const searchSql = `
      SELECT * 
      FROM journals 
      WHERE ${where}
      ORDER BY year DESC, rank ASC NULLS LAST, name ASC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const { rows: journals } = await db.query(searchSql, [...params, limit, offset]);

    return {
      journals,
      totalCount,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(totalCount / limit)
    };
  }

  async getCategories() {
    const sql = `SELECT DISTINCT category FROM journals WHERE category IS NOT NULL ORDER BY category`;
    const { rows } = await db.query(sql);
    return rows.map(r => r.category);
  }

  async getMetadata() {
    const { getRedisClient } = require('../config/redis');
    const redis = getRedisClient();
    const CACHE_KEY = 'library:metadata';

    // Try cache first
    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        console.log('[Cache Hit] Library metadata');
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error('Redis error in library metadata:', e.message);
    }

    const categories = await this.getCategories();
    const tiers = ['Q1', 'Q2', 'Q3', 'Q4', 'N/A'];
    
    const { rows: years } = await db.query(`SELECT DISTINCT year FROM journals WHERE year IS NOT NULL ORDER BY year DESC`);
    const { rows: regions } = await db.query(`SELECT DISTINCT region FROM journals WHERE region IS NOT NULL ORDER BY region`);
    
    const metadata = {
      categories,
      tiers,
      years: years.map(r => r.year),
      regions: regions.map(r => r.region)
    };

    // Save to cache (24 hours)
    try {
      await redis.setex(CACHE_KEY, 86400, JSON.stringify(metadata));
    } catch (e) {
      console.error('Redis set error:', e.message);
    }

    return metadata;
  }
}

module.exports = new LibraryService();
