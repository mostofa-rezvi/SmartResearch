const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { envelope } = require('../utils/responseEnvelope');

// @route   GET /api/v1/onboarding/questions
// @desc    Get all onboarding questions grouped by section
router.get('/questions', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM onboarding_questions ORDER BY sort_order ASC'
    );

    // Group by section
    const grouped = result.rows.reduce((acc, q) => {
      if (!acc[q.section]) acc[q.section] = [];
      acc[q.section].push(q);
      return acc;
    }, {});

    res.json(envelope({ sections: grouped, total: result.rows.length }));
  } catch (err) {
    console.error('Onboarding questions error:', err.message);
    res.status(500).json(envelope(null, { error: 'Server error' }));
  }
});

// @route   GET /api/v1/onboarding/questions/flat
// @desc    Get all onboarding questions as flat array
router.get('/questions/flat', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM onboarding_questions ORDER BY sort_order ASC'
    );
    res.json(envelope(result.rows));
  } catch (err) {
    res.status(500).json(envelope(null, { error: 'Server error' }));
  }
});

module.exports = router;
