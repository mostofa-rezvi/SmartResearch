const express = require('express');
const router = express.Router();
const { celebrate } = require('celebrate');
const communityController = require('../controllers/community.controller');
const communityValidation = require('../validations/community.validation');
const { auth, requireOnboarding } = require('../middleware/auth');

// @route   POST /api/v1/community/posts
// @desc    Create a new post (Question or Thought)
router.post('/posts', 
  [auth, requireOnboarding, celebrate(communityValidation.createPost)], 
  communityController.createPost
);

// @route   GET /api/v1/community/posts
// @desc    Get blended feed posts ranked by discovery module
router.get('/posts', 
  [auth], 
  communityController.getFeed
);

// @route   POST /api/v1/community/posts/:id/vote
// @desc    Vote on a post
router.post('/posts/:id/vote', 
  [auth, requireOnboarding, celebrate(communityValidation.votePost)], 
  communityController.vote
);

module.exports = router;
