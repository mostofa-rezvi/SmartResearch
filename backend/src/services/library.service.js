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

    let sql = `
      SELECT *, COUNT(*) OVER() as total_count 
      FROM journals 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (query) {
      sql += ` AND (name ILIKE $${paramCount} OR issn ILIKE $${paramCount} OR publisher ILIKE $${paramCount})`;
      params.push(`%${query}%`);
      paramCount++;
    }

    if (category) {
      sql += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (tier) {
      sql += ` AND quality_tier = $${paramCount}`;
      params.push(tier);
      paramCount++;
    }

    if (year) {
      sql += ` AND year = $${paramCount}`;
      params.push(year);
      paramCount++;
    }

    if (isOpenAccess === 'true') {
      sql += ` AND is_open_access = true`;
    }

    if (region) {
      sql += ` AND region = $${paramCount}`;
      params.push(region);
      paramCount++;
    }

    // Default sorting: Recent years first, then best rank
    sql += ` ORDER BY year DESC, rank ASC NULLS LAST, name ASC`;

    // Pagination
    const offset = (page - 1) * limit;
    sql += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const { rows } = await db.query(sql, params);
    
    const totalCount = rows.length > 0 ? parseInt(rows[0].total_count) : 0;
    const journals = rows.map(r => {
      const { total_count, ...journal } = r;
      return journal;
    });

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
    const categories = await this.getCategories();
    const tiers = ['Q1', 'Q2', 'Q3', 'Q4', 'N/A'];
    
    const { rows: years } = await db.query(`SELECT DISTINCT year FROM journals WHERE year IS NOT NULL ORDER BY year DESC`);
    const { rows: regions } = await db.query(`SELECT DISTINCT region FROM journals WHERE region IS NOT NULL ORDER BY region`);
    
    return {
      categories,
      tiers,
      years: years.map(r => r.year),
      regions: regions.map(r => r.region)
    };
  }
}

module.exports = new LibraryService();
