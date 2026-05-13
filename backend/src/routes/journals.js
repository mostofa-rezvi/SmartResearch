const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/library.controller');

// @route   GET /api/v1/journals
// @desc    Get filtered list of approved journals with pagination
router.get('/', libraryController.searchJournals);

// @route   GET /api/v1/journals/metadata
// @desc    Get metadata (categories, tiers, years)
router.get('/metadata', libraryController.getLibraryMetadata);

// @route   GET /api/v1/journals/categories
// @desc    Get unique categories (Legacy support)
router.get('/categories', async (req, res) => {
  const libraryService = require('../services/library.service');
  try {
    const categories = await libraryService.getCategories();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
