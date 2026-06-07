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

module.exports = router;
