const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth } = require('../middleware/auth');

// @route   GET /api/discovery/search
// @desc    Personalized research discovery search
router.get('/search', auth, async (req, res) => {
  const { query } = req.query;
  const user = req.user;

  try {
    // 1. Fetch user onboarding data for personalization
    const userResult = await db.query('SELECT research_interests FROM users WHERE id = $1', [user.id]);
    const interests = userResult.rows[0]?.research_interests?.interests || [];

    // 2. Mock Search Results (Normally Elasticsearch)
    let results = [
      { id: 1, title: 'Deep Learning in Clinical Neuroscience', authors: ['J. Smith', 'A. Doe'], journal: 'Nature Medicine', tier: 'Q1', year: 2024, doi: '10.1038/nm.1234', citations: 142, tags: ['AI', 'Neuroscience'] },
      { id: 2, title: 'Quantum Cryptography Protocols for Finance', authors: ['L. Zhang'], journal: 'Phy. Rev. B', tier: 'Q1', year: 2023, doi: '10.1103/prb.5678', citations: 89, tags: ['Quantum Computing', 'Cryptography'] },
      { id: 3, title: 'The Impact of Social Media on Political Theory', authors: ['E. Burke'], journal: 'APSR', tier: 'Q1', year: 2025, doi: '10.1017/apsr.9012', citations: 12, tags: ['Sociology', 'Political Theory'] },
      { id: 4, title: 'New Algorithms for Edge Computing', authors: ['X. Shen'], journal: 'IEEE Trans', tier: 'Q2', year: 2024, doi: '10.1109/it.3456', citations: 45, tags: ['Algorithms'] },
      { id: 5, title: 'Epidemiological Trends in Urban Environments', authors: ['S. Gupta'], journal: 'The Lancet', tier: 'Q1', year: 2023, doi: '10.1016/lan.7890', citations: 215, tags: ['Epidemiology'] }
    ];

    // 3. Simple Personalization Logic
    // Boost results that match user interests
    results = results.map(item => {
      const matchCount = item.tags.filter(tag => interests.includes(tag)).length;
      return { ...item, score: matchCount * 10 + (item.tier === 'Q1' ? 5 : 0), matchedInterest: matchCount > 0 ? item.tags.find(tag => interests.includes(tag)) : null };
    });

    results.sort((a, b) => b.score - a.score);

    res.json(results);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/discovery/save
// @desc    Save a paper to profile
router.post('/save', auth, async (req, res) => {
  const { title, doi, journal } = req.body;
  try {
    await db.query(
      'INSERT INTO saved_papers (user_id, paper_title, paper_doi, journal_name) VALUES ($1, $2, $3, $4)',
      [req.user.id, title, doi, journal]
    );
    res.json({ message: 'Paper saved' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
