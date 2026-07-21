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

// @route   GET /api/v1/discovery/suggested-collaborators
// @desc    Find 2nd-degree collaborator suggestions
router.get('/suggested-collaborators',
  auth,
  discoveryController.getSuggestedCollaborators
);

// @route   GET /api/v1/discovery/recommendations
// @desc    Find researcher recommendations based on onboarding
router.get('/recommendations',
  auth,
  discoveryController.getRecommendations
);

// @route   GET /api/v1/discovery/feed
// @desc    Unified recommendation feed: collaborators + relevant papers + open projects
router.get('/feed',
  auth,
  discoveryController.getFeed
);

module.exports = router;
