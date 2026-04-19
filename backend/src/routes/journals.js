const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { envelope } = require('../utils/responseEnvelope');

// @route   GET /api/v1/journals
// @desc    Get filtered list of approved journals
router.get('/', async (req, res) => {
  const { category, subcategory, tier, geography, group } = req.query;
  
  let queryParts = ["SELECT * FROM journals WHERE status = 'approved'"];
  let params = [];
  let paramCount = 1;

  if (category) {
    queryParts.push(`AND category = $${paramCount++}`);
    params.push(category);
  }
  if (subcategory) {
    queryParts.push(`AND subcategory = $${paramCount++}`);
    params.push(subcategory);
  }
  if (tier) {
    queryParts.push(`AND quality_tier = $${paramCount++}`);
    params.push(tier);
  }
  if (geography) {
    queryParts.push(`AND geography = $${paramCount++}`);
    params.push(geography);
  }
  if (group) {
    queryParts.push(`AND institutional_group = $${paramCount++}`);
    params.push(group);
  }

  queryParts.push('ORDER BY impact_factor DESC');

  try {
    const result = await db.query(queryParts.join(' '), params);
    res.json(envelope(result.rows));
  } catch (err) {
    console.error(err.message);
    res.status(500).json(envelope(null, { error: 'Server error' }));
  }
});

// @route   GET /api/v1/journals/categories
// @desc    Get unique categories for navigation
router.get('/categories', async (req, res) => {
  try {
    const result = await db.query('SELECT DISTINCT category FROM journals');
    res.json(envelope(result.rows.map(r => r.category)));
  } catch (err) {
    res.status(500).json(envelope(null, { error: 'Server error' }));
  }
});

module.exports = router;
