const db = require('../config/db');

class LibraryService {
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
