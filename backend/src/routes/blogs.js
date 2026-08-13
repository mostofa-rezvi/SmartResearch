const express = require('express');
const router = express.Router();
const blogsController = require('../controllers/blogs.controller');
const { auth } = require('../middleware/auth');

// Public routes
router.get('/', blogsController.getApprovedBlogs);
router.get('/admin', auth, blogsController.getAdminBlogs);
router.get('/:id', blogsController.getBlogById);

// Protected routes (User)
router.post('/', auth, blogsController.createBlog);

// Protected routes (Admin)
router.patch('/:id/status', auth, blogsController.updateBlogStatus);

module.exports = router;
