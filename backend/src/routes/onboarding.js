const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { envelope } = require('../utils/responseEnvelope');

const { auth } = require('../middleware/auth');

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

// @route   GET /api/v1/onboarding/user-interests
// @desc    Get user's onboarding interests (computed from answers)
router.get('/user-interests', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const answersResult = await db.query(
      `SELECT q.question_text, a.answer_data 
       FROM onboarding_answers a
       JOIN onboarding_questions q ON a.question_id = q.id
       WHERE a.user_id = $1 AND q.section IN ('focus', 'identity', 'publication')`,
      [userId]
    );
    
    let userInterests = [];
    answersResult.rows.forEach(r => {
      let ans = [];
      try { ans = JSON.parse(r.answer_data); } catch (e) { ans = [r.answer_data]; }
      if (Array.isArray(ans)) {
        userInterests = userInterests.concat(ans);
      } else if (typeof ans === 'string') {
        userInterests.push(ans);
      }
    });
    
    res.json(envelope({ interests: userInterests }));
  } catch (err) {
    console.error('User interests error:', err.message);
    res.status(500).json(envelope(null, { error: 'Server error' }));
  }
});

// @route   GET /api/v1/onboarding/user-answers
// @desc    Get user's raw onboarding answers
router.get('/user-answers', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT question_id, answer_data FROM onboarding_answers WHERE user_id = $1`,
      [userId]
    );
    
    const answers = {};
    result.rows.forEach(r => {
      let parsed = r.answer_data;
      try {
        parsed = JSON.parse(r.answer_data);
      } catch (e) {
        // use raw if not parseable
      }
      answers[r.question_id] = parsed;
    });
    
    res.json(envelope(answers));
  } catch (err) {
    console.error('User answers error:', err.message);
    res.status(500).json(envelope(null, { error: 'Server error' }));
  }
});

module.exports = router;
