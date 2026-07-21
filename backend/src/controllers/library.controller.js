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

/** POST /api/v1/library/items — create a library item (paper/dataset/note/review); optional file upload. */
const createItem = async (req, res) => {
  try {
    const item = await libraryService.createItem(req.user.id, req.body, req.file || null);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    logger.error('[Library] create item failed:', error.message);
    res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
  }
};

/** GET /api/v1/library/items?type= — list the current user's library items. */
const listItems = async (req, res) => {
  try {
    const items = await libraryService.listItems(req.user.id, req.query.type || null);
    res.json({ success: true, data: items });
  } catch (error) {
    logger.error('[Library] list items failed:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** GET /api/v1/library/search?q=&type= — semantic + full-text search over the current user's discoverable items. */
const searchItems = async (req, res) => {
  try {
    const results = await libraryService.searchItems(
      (req.query.q || '').trim(), Math.min(parseInt(req.query.limit) || 20, 50), { itemType: req.query.type || null });
    res.json({ success: true, data: results });
  } catch (error) {
    logger.error('[Library] search items failed:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** GET /api/v1/library/discover?q=&type= — discover shared content across all users. */
const discoverItems = async (req, res) => {
  try {
    const results = await libraryService.discoverItems({
      q: req.query.q || '', type: req.query.type || null, limit: Math.min(parseInt(req.query.limit) || 20, 50) });
    res.json({ success: true, data: results });
  } catch (error) {
    logger.error('[Library] discover failed:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** GET /api/v1/library/items/:id/download — stream a stored PDF through the backend. */
const downloadItem = async (req, res) => {
  try {
    const { body, contentType, filename } = await libraryService.getItemFile(parseInt(req.params.id), req.user.id);
    res.setHeader('Content-Type', contentType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    // AWS SDK v3 Body is a Node Readable stream in Node runtimes
    if (body && typeof body.pipe === 'function') {
      body.pipe(res);
    } else {
      const buf = Buffer.from(await body.transformToByteArray());
      res.end(buf);
    }
  } catch (error) {
    logger.error('[Library] download failed:', error.message);
    res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
  }
};

module.exports = { searchJournals, getLibraryMetadata, extractPdf, createItem, listItems, searchItems, discoverItems, downloadItem };
