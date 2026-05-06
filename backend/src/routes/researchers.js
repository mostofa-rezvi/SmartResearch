const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { envelope } = require('../utils/responseEnvelope');

// @route   GET /api/v1/researchers
// @desc    Get researchers from local DB (seeded from OpenAlex)
// @query   domain, country, page, limit, q (name search)
router.get('/', async (req, res) => {
  const { domain, country, q, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

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
      [...params, parseInt(limit), offset]
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

  try {
    let filter = `cited_by_count:>${min_citations}`;
    if (country_code) filter += `,last_known_institution.country_code:${country_code.toUpperCase()}`;

    const url = `https://api.openalex.org/authors?filter=${encodeURIComponent(filter)}&per-page=${per_page}&page=${page}&mailto=research@researchbridge.app`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`OpenAlex API responded with ${response.status}`);
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

    res.json(envelope(researchers, null, {
      total: data.meta?.count,
      page: parseInt(page),
      per_page: parseInt(per_page)
    }));
  } catch (err) {
    console.error('OpenAlex proxy error:', err.message);
    res.status(502).json(envelope(null, { error: `OpenAlex API error: ${err.message}` }));
  }
});

// @route   GET /api/v1/researchers/:id
// @desc    Get single researcher from local DB
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM researchers WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json(envelope(null, { error: 'Not found' }));
    res.json(envelope(result.rows[0]));
  } catch (err) {
    res.status(500).json(envelope(null, { error: 'Server error' }));
  }
});

module.exports = router;
