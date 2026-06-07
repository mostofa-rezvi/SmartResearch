const axios = require('axios');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// ── Scimago in-memory store ────────────────────────────────────────────────────
// Loaded once at module init from a local JSON seed file.
// If the file doesn't exist, an empty array is used (safe fallback).
let scimagoData = [];

const SCIMAGO_PATH = path.join(__dirname, '../../data/scimago_journals.json');

const loadScimagoData = () => {
  try {
    if (fs.existsSync(SCIMAGO_PATH)) {
      const raw = fs.readFileSync(SCIMAGO_PATH, 'utf8');
      scimagoData = JSON.parse(raw);
      logger.info(`[Publications] Loaded ${scimagoData.length} Scimago journals from cache`);
    } else {
      logger.warn('[Publications] scimago_journals.json not found — run scripts/scimago_seed.js to create it');
      // Use a small hardcoded seed so the UI still works
      scimagoData = SCIMAGO_SEED;
    }
  } catch (err) {
    logger.error('[Publications] Failed to load Scimago data:', err.message);
    scimagoData = SCIMAGO_SEED;
  }
};

// Small built-in seed for demonstration
const SCIMAGO_SEED = [
  { title: "Nature", issn: "0028-0836", subject: "Multidisciplinary", sjr: 15.234, h_index: 1130, country: "United Kingdom", publisher: "Springer Nature", quartile: "Q1", open_access: false },
  { title: "Science", issn: "0036-8075", subject: "Multidisciplinary", sjr: 14.108, h_index: 1058, country: "United States", publisher: "American Association for the Advancement of Science", quartile: "Q1", open_access: false },
  { title: "Nature Communications", issn: "2041-1723", subject: "Multidisciplinary", sjr: 5.321, h_index: 295, country: "United Kingdom", publisher: "Springer Nature", quartile: "Q1", open_access: true },
  { title: "Cell", issn: "0092-8674", subject: "Biochemistry, Genetics and Molecular Biology", sjr: 13.845, h_index: 719, country: "United States", publisher: "Elsevier", quartile: "Q1", open_access: false },
  { title: "The Lancet", issn: "0140-6736", subject: "Medicine", sjr: 12.456, h_index: 672, country: "United Kingdom", publisher: "Elsevier", quartile: "Q1", open_access: false },
  { title: "PLOS ONE", issn: "1932-6203", subject: "Multidisciplinary", sjr: 0.93, h_index: 332, country: "United States", publisher: "Public Library of Science", quartile: "Q1", open_access: true },
  { title: "IEEE Transactions on Neural Networks and Learning Systems", issn: "2162-237X", subject: "Artificial Intelligence", sjr: 3.124, h_index: 145, country: "United States", publisher: "IEEE", quartile: "Q1", open_access: false },
  { title: "Journal of Machine Learning Research", issn: "1532-4435", subject: "Artificial Intelligence", sjr: 2.891, h_index: 180, country: "United States", publisher: "MIT Press", quartile: "Q1", open_access: true },
  { title: "Bioinformatics", issn: "1367-4803", subject: "Computational Biology", sjr: 2.74, h_index: 290, country: "United Kingdom", publisher: "Oxford University Press", quartile: "Q1", open_access: false },
  { title: "Physical Review Letters", issn: "0031-9007", subject: "Physics", sjr: 4.22, h_index: 499, country: "United States", publisher: "American Physical Society", quartile: "Q1", open_access: false },
  { title: "Advanced Materials", issn: "0935-9648", subject: "Materials Science", sjr: 7.44, h_index: 435, country: "Germany", publisher: "Wiley-VCH", quartile: "Q1", open_access: false },
  { title: "Frontiers in Neuroscience", issn: "1662-4548", subject: "Neuroscience", sjr: 1.23, h_index: 98, country: "Switzerland", publisher: "Frontiers Media", quartile: "Q1", open_access: true },
];

// Load Scimago data at module init
loadScimagoData();

// ── Controllers ─────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/publications/cite
 * Proxies to ML /llm/citations endpoint.
 */
exports.generateCitation = async (req, res) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/llm/citations`, req.body, {
      timeout: 30000,
    });
    res.status(200).json({ success: true, data: response.data });
  } catch (err) {
    logger.error('[Publications] Citation generation failed:', err.message);
    if (err.response) {
      return res.status(err.response.status).json({ success: false, message: err.response.data?.detail || 'LLM service error' });
    }
    res.status(503).json({ success: false, message: 'ML service unavailable' });
  }
};

/**
 * POST /api/v1/publications/feedback
 * Proxies to ML /llm/feedback endpoint.
 */
exports.getWritingFeedback = async (req, res) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/llm/feedback`, req.body, {
      timeout: 60000, // Allow longer for feedback generation
    });
    res.status(200).json({ success: true, data: response.data });
  } catch (err) {
    logger.error('[Publications] Writing feedback failed:', err.message);
    if (err.response) {
      return res.status(err.response.status).json({ success: false, message: err.response.data?.detail || 'LLM service error' });
    }
    res.status(503).json({ success: false, message: 'ML service unavailable' });
  }
};

/**
 * GET /api/v1/publications/scimago?q=keyword&subject=Physics&limit=20
 * Search local Scimago journal index.
 */
exports.searchScimago = (req, res) => {
  try {
    const query = (req.query.q || '').toLowerCase();
    const subject = (req.query.subject || '').toLowerCase();
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const openAccessOnly = req.query.open_access === 'true';

    let results = scimagoData;

    if (query) {
      results = results.filter(j =>
        j.title.toLowerCase().includes(query) ||
        j.subject?.toLowerCase().includes(query) ||
        j.publisher?.toLowerCase().includes(query)
      );
    }

    if (subject) {
      results = results.filter(j => j.subject?.toLowerCase().includes(subject));
    }

    if (openAccessOnly) {
      results = results.filter(j => j.open_access === true);
    }

    // Sort by SJR descending
    results = results
      .sort((a, b) => (b.sjr || 0) - (a.sjr || 0))
      .slice(0, limit);

    res.status(200).json({ success: true, data: results, total: results.length });
  } catch (err) {
    logger.error('[Publications] Scimago search failed:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/v1/publications/checklist
 * Returns the publication readiness checklist template.
 */
exports.getChecklist = (req, res) => {
  const checklist = [
    { id: 1, task: "Define research question and objectives", category: "planning", required: true },
    { id: 2, task: "Conduct literature review", category: "planning", required: true },
    { id: 3, task: "Write abstract (max 250 words)", category: "writing", required: true },
    { id: 4, task: "Select keywords (5–10 terms)", category: "writing", required: true },
    { id: 5, task: "Choose target journal using Scimago Finder", category: "submission", required: true },
    { id: 6, task: "Download and apply journal template", category: "formatting", required: true },
    { id: 7, task: "Generate formatted citations", category: "citations", required: true },
    { id: 8, task: "Ensure DOI links are valid", category: "citations", required: false },
    { id: 9, task: "Get AI writing feedback on abstract", category: "quality", required: false },
    { id: 10, task: "Check manuscript against journal author guidelines", category: "submission", required: true },
    { id: 11, task: "Declare conflicts of interest", category: "ethics", required: true },
    { id: 12, task: "Obtain co-author approvals", category: "submission", required: true },
  ];

  res.status(200).json({ success: true, data: checklist });
};
