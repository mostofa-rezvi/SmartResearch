const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { envelope } = require('../utils/responseEnvelope');
const { getRedisClient } = require('../config/redis');

// @route   GET /api/v1/researchers
// @desc    Get researchers from local DB (seeded from OpenAlex)
// @query   domain, country, page, limit, q (name search)
router.get('/', async (req, res) => {
  const { domain, country, q, page = 1, limit = 1000 } = req.query;
  const safeLimit = Math.min(parseInt(limit), 1000);
  const offset = (parseInt(page) - 1) * safeLimit;

  let whereClauses = [];
  let params = [];
  let idx = 1;

  if (domain) {
    whereClauses.push(`research_domains::text ILIKE $${idx++}`);
    params.push(`%${domain}%`);
  }
  if (country) {
    whereClauses.push(`country_code = $${idx++}`);
    params.push(country.toUpperCase());
  }
  if (q) {
    whereClauses.push(`(name ILIKE $${idx} OR institution ILIKE $${idx})`);
    params.push(`%${q}%`);
    idx++;
  }

  const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  try {
    const countResult = await db.query(
      `SELECT COUNT(*) FROM researchers ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `SELECT * FROM researchers ${where}
       ORDER BY citation_count DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, safeLimit, offset]
    );

    res.json(envelope(result.rows, null, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    }));
  } catch (err) {
    console.error('Researchers fetch error:', err.message);
    res.status(500).json(envelope(null, { error: 'Server error' }));
  }
});

// @route   GET /api/v1/researchers/openalex-sync
// @desc    Proxy live OpenAlex data (no DB needed) — returns up to 25 researchers
// @query   domain, country_code, min_citations
router.get('/openalex-sync', async (req, res) => {
  const {
    domain = 'machine learning',
    country_code,
    min_citations = 500,
    per_page = 25,
    page = 1
  } = req.query;

  const limit = Math.min(parseInt(per_page), 100);
  const cacheKey = `openalex:sync:${domain}:${country_code || 'all'}:${min_citations}:${per_page}:${page}`;
  const redis = getRedisClient();

  try {
    // 1. Check Cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`[Cache Hit] OpenAlex sync: ${cacheKey}`);
      return res.json(JSON.parse(cached));
    }

    // 2. Fetch from OpenAlex
    let filter = `cited_by_count:>${min_citations}`;
    if (country_code) filter += `,last_known_institution.country_code:${country_code.toUpperCase()}`;
    
    // Simple domain keyword search in concepts
    const url = `https://api.openalex.org/authors?filter=${encodeURIComponent(filter)}&per-page=${per_page}&page=${page}&mailto=research@researchbridge.app`;

    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`OpenAlex sync rate limited or error (${response.status}). Returning empty fallback list.`);
      return res.json(envelope([], null, {
        total: 0,
        page: parseInt(page),
        per_page: parseInt(per_page),
        warning: `OpenAlex API status ${response.status}`
      }));
    }
    const data = await response.json();

    const researchers = (data.results || []).map(author => ({
      id: author.id,
      openalex_id: author.id,
      name: author.display_name,
      orcid: author.orcid,
      institution: author.last_known_institution?.display_name || null,
      country_code: author.last_known_institution?.country_code || null,
      citation_count: author.cited_by_count,
      works_count: author.works_count,
      h_index: author.summary_stats?.h_index || null,
      research_domains: (author.x_concepts || []).slice(0, 5).map(c => c.display_name),
      profile_url: author.id,
      orcid_url: author.orcid ? `https://orcid.org/${author.orcid.replace('https://orcid.org/', '')}` : null,
    }));

    const responseBody = envelope(researchers, null, {
      total: data.meta?.count || researchers.length,
      page: parseInt(page),
      per_page: parseInt(per_page)
    });

    // 3. Save to Cache (1 hour)
    try {
      await redis.setex(cacheKey, 3600, JSON.stringify(responseBody));
    } catch (e) {}

    res.json(responseBody);
  } catch (err) {
    console.error('OpenAlex proxy error:', err.message);
    res.json(envelope([], null, { total: 0, page: parseInt(page), per_page: parseInt(per_page), warning: err.message }));
  }
});

// Helper to extract OpenAlex ID from URI or string
const extractOpenAlexId = (id) => {
  if (typeof id !== 'string') return id;
  if (id.startsWith('https://openalex.org/')) {
    return id.replace('https://openalex.org/', '');
  }
  return id;
};

// @route   GET /api/v1/researchers/:id
// @desc    Get single researcher from local DB or OpenAlex
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const cleanId = extractOpenAlexId(id);

  try {
    let result;
    if (!isNaN(cleanId)) {
      // Local numeric ID
      result = await db.query('SELECT * FROM researchers WHERE id = $1', [parseInt(cleanId)]);
    } else {
      // OpenAlex string ID (e.g. A5077297577)
      result = await db.query('SELECT * FROM researchers WHERE openalex_id ILIKE $1', [`%${cleanId}%`]);
    }

    if (result.rows.length) {
      return res.json(envelope(result.rows[0]));
    }

    // Fallback: Fetch from OpenAlex if not in DB
    if (cleanId.startsWith('A')) {
      const oaUrl = `https://api.openalex.org/authors/A${cleanId.replace('A', '')}?mailto=research@researchbridge.app`;
      const oaRes = await fetch(oaUrl);
      if (oaRes.ok) {
        const author = await oaRes.json();
        const normalized = {
          id: cleanId, // Using string ID as internal ID for now
          openalex_id: author.id,
          name: author.display_name,
          institution: author.last_known_institution?.display_name || null,
          citation_count: author.cited_by_count,
          h_index: author.summary_stats?.h_index || null,
          works_count: author.works_count,
          research_domains: (author.x_concepts || []).slice(0, 5).map(c => c.display_name),
          avatar_url: null,
          country_code: author.last_known_institution?.country_code || null
        };
        return res.json(envelope(normalized));
      }
    }

    res.status(404).json(envelope(null, { error: 'Not found' }));
  } catch (err) {
    console.error('Researcher detail fetch error:', err.message);
    res.status(500).json(envelope(null, { error: 'Server error' }));
  }
});

// @route   GET /api/v1/researchers/:id/works
// @desc    Get works for a researcher (fetches from OpenAlex via author ID)
router.get('/:id/works', async (req, res) => {
  const { id } = req.params;
  const cleanId = extractOpenAlexId(id);
  const { page = 1, per_page = 10 } = req.query;

  const cacheKey = `openalex:works:${cleanId}:${page}:${per_page}`;
  const redis = getRedisClient();

  try {
    // 1. Check Redis Cache
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    } catch (e) {
      // Ignore redis cache lookup error
    }

    let openalexId;
    if (!isNaN(cleanId)) {
      // Get researcher to find openalex_id
      const result = await db.query('SELECT openalex_id FROM researchers WHERE id = $1', [parseInt(cleanId)]);
      if (!result.rows.length) return res.status(404).json(envelope(null, { error: 'Researcher not found' }));
      openalexId = result.rows[0].openalex_id;
    } else {
      openalexId = `https://openalex.org/${cleanId}`;
    }

    if (!openalexId) {
      return res.json({ ...envelope([]), meta: { total: 0, page: parseInt(page), per_page: parseInt(per_page), has_more: false } });
    }

    // 2. Fetch works from OpenAlex with pagination support
    const url = `https://api.openalex.org/works?filter=author.id:${openalexId}&page=${page}&per-page=${per_page}&mailto=research@researchbridge.app`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`OpenAlex API works warning (${response.status}) for ${openalexId}`);
      return res.json({
        ...envelope([]),
        meta: {
          total: 0,
          page: parseInt(page),
          per_page: parseInt(per_page),
          has_more: false,
          warning: `OpenAlex API status ${response.status}`
        }
      });
    }
    const data = await response.json();

    const works = (data.results || []).map(work => ({
      id: work.id,
      title: work.display_name,
      publication_year: work.publication_year,
      type: work.type,
      doi: work.doi,
      citation_count: work.cited_by_count,
      journal: work.primary_location?.source?.display_name || 'Unknown Journal',
      landing_page_url: work.primary_location?.landing_page_url || work.doi
    }));

    const responseBody = {
      ...envelope(works),
      meta: {
        total: data.meta?.count || works.length,
        page: parseInt(page),
        per_page: parseInt(per_page),
        has_more: (data.meta?.count || 0) > (parseInt(page) * parseInt(per_page))
      }
    };

    try {
      await redis.setex(cacheKey, 3600, JSON.stringify(responseBody));
    } catch (e) {}

    res.json(responseBody);
  } catch (err) {
    console.error('Works fetch error:', err.message);
    res.json({
      ...envelope([]),
      meta: { total: 0, page: parseInt(page), per_page: parseInt(per_page), has_more: false, error: err.message }
    });
  }
});


module.exports = router;
