const express = require('express');
const { celebrate } = require('celebrate');
const communityController = require('../controllers/community.controller');
const communityValidation = require('../validations/community.validation');
const { verifyAuth } = require('../middleware/auth.middleware');
const multer = require('multer');

const router = express.Router();

// Setup multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for research images
});

// @route   POST /api/v1/community/posts
// @desc    Create a new post
router.post('/posts',
  [verifyAuth, celebrate(communityValidation.createPost)],
  communityController.createPost
);

// @route   GET /api/v1/community/posts
// @desc    Get personalised global feed
router.get('/posts',
  [verifyAuth],
  communityController.getFeed
);
// @route   GET /api/v1/community/posts/:id
// @desc    Get a single post details
router.get('/posts/:id',
  [verifyAuth],
  communityController.getPostById
);

// @route   GET /api/v1/community/groups/:groupId/posts
// @desc    Get posts for a specific group
router.get('/groups/:groupId/posts',
  [verifyAuth],
  communityController.getGroupFeed
);

// @route   POST /api/v1/community/posts/:id/vote
// @desc    Upvote or downvote a post
router.post('/posts/:id/vote',
  [verifyAuth, celebrate(communityValidation.votePost)],
  communityController.vote
);

// @route   POST /api/v1/community/posts/:id/react
// @desc    Add one of 5 LinkedIn-style reactions to a post
router.post('/posts/:id/react',
  [verifyAuth],
  communityController.react
);

// @route   GET /api/v1/community/posts/:id/comments
// @desc    Get all comments for a post
router.get('/posts/:id/comments',
  [verifyAuth],
  communityController.getComments
);

// @route   POST /api/v1/community/posts/:id/comments
// @desc    Add a comment to a post
router.post('/posts/:id/comments',
  [verifyAuth, celebrate(communityValidation.addComment)],
  communityController.addComment
);

// @route   POST /api/v1/community/posts/:id/share
// @desc    Share / repost a post
router.post('/posts/:id/share',
  [verifyAuth],
  communityController.sharePost
);

// Post Management
router.patch('/posts/:id', [verifyAuth], communityController.updatePost);
router.delete('/posts/:id', [verifyAuth], communityController.deletePost);

// Comment Management
router.patch('/comments/:id', [verifyAuth], communityController.updateComment);
router.delete('/comments/:id', [verifyAuth], communityController.deleteComment);

// Image Upload
router.post('/upload', [verifyAuth, upload.single('image')], communityController.uploadImage);

module.exports = router;
