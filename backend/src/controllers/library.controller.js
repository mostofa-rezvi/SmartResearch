const axios = require('axios');
const FormData = require('form-data');
const libraryService = require('../services/library.service');
const logger = require('../utils/logger');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

const searchJournals = async (req, res) => {
  try {
    const results = await libraryService.searchJournals(req.query);
    res.json({ status: 'success', data: results });
  } catch (error) {
    logger.error('Library search error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to search journals' });
  }
};

const getLibraryMetadata = async (req, res) => {
  try {
    const metadata = await libraryService.getMetadata();
    res.json({ status: 'success', data: metadata });
  } catch (error) {
    logger.error('Library metadata error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch library metadata' });
  }
};

/**
 * POST /api/v1/library/extract-pdf
 * Receives a PDF via multer and proxies it to the ML service for text extraction.
 * Returns: { title, abstract, full_text, page_count, word_count, char_count }
 */
const extractPdf = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No PDF file provided' });
  }

  try {
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname || 'document.pdf',
      contentType: 'application/pdf',
    });

    const response = await axios.post(`${ML_SERVICE_URL}/library/extract-pdf`, form, {
      headers: { ...form.getHeaders() },
      timeout: 60000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    res.status(200).json({ success: true, data: response.data });
  } catch (err) {
    logger.error('[Library] PDF extraction proxy failed:', err.message);
    if (err.response) {
      return res.status(err.response.status).json({
        success: false,
        message: err.response.data?.detail || 'ML service error'
      });
    }
    res.status(503).json({ success: false, message: 'ML service unavailable. Is it running?' });
  }
};

module.exports = { searchJournals, getLibraryMetadata, extractPdf };
