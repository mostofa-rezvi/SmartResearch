const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const { requireAuth } = require('../middleware/auth');

// Public route to resolve DOI
router.get('/doi', searchController.resolveDoi);

module.exports = router;
