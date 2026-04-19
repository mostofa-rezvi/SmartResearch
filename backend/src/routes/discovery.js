const express = require('express');
const router = express.Router();
const { celebrate } = require('celebrate');
const discoveryController = require('../controllers/discovery.controller');
const discoveryValidation = require('../validations/discovery.validation');
const { auth, requireOnboarding } = require('../middleware/auth');

// @route   GET /api/v1/discovery/search
// @desc    Personalized research discovery search
router.get('/search', 
  [auth, celebrate(discoveryValidation.search)], 
  discoveryController.search
);

// @route   POST /api/v1/discovery/save
// @desc    Save a paper to profile
router.post('/save', 
  [auth, celebrate(discoveryValidation.savePaper)], 
  discoveryController.save
);

module.exports = router;
