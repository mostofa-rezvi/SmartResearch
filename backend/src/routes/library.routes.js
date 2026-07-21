const express = require('express');
const router = express.Router();
const multer = require('multer');
const libraryController = require('../controllers/library.controller');
const { verifyAuth } = require('../middleware/auth.middleware');

// Multer: in-memory storage, 50MB limit, PDF only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname?.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are accepted'));
    }
  }
});

// @route   GET /api/v1/library/journals
// @desc    Search journal catalog
// @access  Public
router.get('/journals', libraryController.searchJournals);

// @route   GET /api/v1/library/metadata
// @desc    Library metadata (counts, categories)
// @access  Public
router.get('/metadata', libraryController.getLibraryMetadata);

// @route   POST /api/v1/library/extract-pdf
// @desc    Extract text, title and abstract from an uploaded PDF
// @access  Private
router.post(
  '/extract-pdf',
  verifyAuth,
  upload.single('file'),
  libraryController.extractPdf
);

// @route   GET /api/v1/library/search?q=&type=
// @desc    Semantic + full-text search over library items
// @access  Private
router.get('/search', verifyAuth, libraryController.searchItems);

// @route   GET /api/v1/library/discover?q=&type=
// @desc    Discover shared library content across all users
// @access  Private
router.get('/discover', verifyAuth, libraryController.discoverItems);

// @route   GET /api/v1/library/items/:id/download
// @desc    Stream a stored PDF for a library item
// @access  Private
router.get('/items/:id/download', verifyAuth, libraryController.downloadItem);

// @route   GET /api/v1/library/items?type=
// @desc    List the current user's library items
// @access  Private
router.get('/items', verifyAuth, libraryController.listItems);

// @route   POST /api/v1/library/items
// @desc    Create a library item (paper/dataset/note/literature_review); optional PDF upload
// @access  Private
router.post('/items', verifyAuth, upload.single('file'), libraryController.createItem);

module.exports = router;
