const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/library.controller');
const auth = require('../middleware/auth');

// Publicly searchable library, but could be restricted if needed
router.get('/journals', libraryController.searchJournals);
router.get('/metadata', libraryController.getLibraryMetadata);

module.exports = router;
