const axios = require('axios');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const db = require('../config/db');

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
/**
 * GET /api/v1/publications/scimago?q=&subject=&limit=&open_access=&min_impact=
 * Journal recommendation over the real Scimago-seeded `journals` table (~405K rows).
 * Ranks by SJR / impact factor; supports topic (q), subject, open-access and
 * minimum-impact filters. Falls back to a live DOAJ query if the local table is empty.
 */
exports.searchScimago = async (req, res) => {
  try {
    const query = (req.query.q || '').trim();
    const subject = (req.query.subject || '').trim();
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const openAccessOnly = req.query.open_access === 'true';
    const minImpact = parseFloat(req.query.min_impact) || 0;

    const params = [];
    const where = ["status IS DISTINCT FROM 'rejected'"];
    if (query) {
      params.push(`%${query}%`);
      const i = params.length;
      where.push(`(name ILIKE $${i} OR category ILIKE $${i} OR publisher ILIKE $${i} OR subjects::text ILIKE $${i})`);
    }
    if (subject) { params.push(`%${subject}%`); where.push(`(category ILIKE $${params.length} OR subjects::text ILIKE $${params.length})`); }
    if (openAccessOnly) where.push('is_open_access = TRUE');
    if (minImpact > 0) { params.push(minImpact); where.push(`COALESCE(sjr_score, impact_factor, 0) >= $${params.length}`); }
    params.push(limit);

    const sql = `
      SELECT name, issn, category, quality_tier, sjr_score, impact_factor, h_index,
             publisher, country, is_open_access, homepage_url, doaj_url
        FROM journals
       WHERE ${where.join(' AND ')}
       ORDER BY COALESCE(sjr_score, impact_factor, 0) DESC NULLS LAST
       LIMIT $${params.length}`;
    const { rows } = await db.query(sql, params);

    const data = rows.map((j) => ({
      title: j.name,
      issn: j.issn,
      subject: j.category,
      sjr: j.sjr_score != null ? Number(j.sjr_score) : null,
      impact_factor: j.impact_factor != null ? Number(j.impact_factor) : null,
      h_index: j.h_index,
      country: j.country,
      publisher: j.publisher,
      quartile: j.quality_tier,
      open_access: j.is_open_access === true,
      homepage_url: j.homepage_url,
      doaj_url: j.doaj_url,
      source: 'scimago',
    }));

    // D2: live DOAJ fallback when the local table yields nothing
    if (data.length === 0 && query) {
      try {
        const doaj = await exports._queryDoaj(query, limit);
        return res.status(200).json({ success: true, data: doaj, total: doaj.length, source: 'doaj' });
      } catch (e) {
        logger.warn(`[Publications] DOAJ fallback failed: ${e.message}`);
      }
    }

    res.status(200).json({ success: true, data, total: data.length, source: 'scimago' });
  } catch (err) {
    logger.error('[Publications] Scimago search failed:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Abstract-based journal recommendation (semantic re-ranking) ─────────────────

const _STOP = new Set(('the a an of and or to in for on with we our is are this that by as from using based can be which it at has have not also more than these their study paper results method methods approach approaches propose present show novel new via into between within their they them such may many most much both each other over under about across among per via given while where when what how why who whom whose').split(' '));

/** Extract the most frequent content keywords from an abstract. */
function _topKeywords(text, n = 8) {
  const freq = {};
  (String(text).toLowerCase().match(/[a-z][a-z-]{3,}/g) || []).forEach((w) => {
    if (!_STOP.has(w)) freq[w] = (freq[w] || 0) + 1;
  });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, n).map((x) => x[0]);
}

function _cosine(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d > 0 ? dot / d : 0;
}

/**
 * POST /api/v1/publications/recommend-journals
 * Body: { abstract, subject?, open_access?, min_impact?, limit? }
 *
 * Recommends journals for a manuscript by (1) cheaply retrieving keyword candidates
 * from the real ~405K Scimago journals table, then (2) semantically re-ranking them
 * by cosine similarity between the paper abstract and each journal's scope (both
 * embedded with Sentence-BERT), blended with the journal's SJR/impact.
 */
exports.recommendJournalsByAbstract = async (req, res) => {
  try {
    const abstract = (req.body.abstract || '').trim();
    if (abstract.length < 40) {
      return res.status(400).json({ success: false, message: 'Provide a manuscript abstract (≥ 40 chars).' });
    }
    const limit = Math.min(parseInt(req.body.limit) || 10, 25);
    const openAccessOnly = req.body.open_access === true || req.body.open_access === 'true';
    const minImpact = parseFloat(req.body.min_impact) || 0;
    const subject = (req.body.subject || '').trim();

    // 1) Retrieve candidates by keyword (abstract terms + optional subject)
    const keywords = _topKeywords(abstract, 8);
    if (subject) keywords.push(subject.toLowerCase());
    const patterns = keywords.map((k) => `%${k}%`);
    const params = [patterns];
    const where = ["status IS DISTINCT FROM 'rejected'",
      // real journals only (exclude conference proceedings / book series)
      "COALESCE(journal_type,'journal') IN ('journal','trade journal')",
      '(name ILIKE ANY($1) OR category ILIKE ANY($1) OR subjects::text ILIKE ANY($1))'];
    if (openAccessOnly) where.push('is_open_access = TRUE');
    if (minImpact > 0) { params.push(minImpact); where.push(`COALESCE(sjr_score, impact_factor, 0) >= $${params.length}`); }

    const candSql = `
      SELECT DISTINCT ON (name) name, issn, category, subcategory, subjects, areas,
             sjr_score, impact_factor, h_index, country, publisher, quality_tier,
             is_open_access, homepage_url, doaj_url
        FROM journals
       WHERE ${where.join(' AND ')}
       ORDER BY name, COALESCE(sjr_score, impact_factor, 0) DESC NULLS LAST
       LIMIT 80`;
    const { rows } = await db.query(candSql, params);

    if (rows.length === 0) {
      return res.status(200).json({ success: true, data: [], total: 0, source: 'scimago', note: 'No keyword candidates matched the abstract.' });
    }

    // 2) Embed the abstract + each candidate's scope text (batch), then cosine re-rank
    const scopeText = (j) => {
      const subs = Array.isArray(j.subjects) ? j.subjects.join(', ') : '';
      const areas = Array.isArray(j.areas) ? j.areas.join(', ') : '';
      return [j.name, j.category, j.subcategory, subs, areas].filter(Boolean).join('. ');
    };
    let vectors = null;
    try {
      const emb = await axios.post(`${ML_SERVICE_URL}/embed`,
        { text: [abstract, ...rows.map(scopeText)] }, { timeout: 60000 });
      vectors = emb.data?.vectors || emb.data?.embedding || null;
    } catch (e) {
      logger.warn(`[Publications] abstract embedding failed, falling back to SJR order: ${e.message}`);
    }

    const maxSjr = Math.max(1e-6, ...rows.map((j) => Number(j.sjr_score) || 0));
    let scored;
    if (Array.isArray(vectors) && vectors.length === rows.length + 1) {
      const abstractVec = vectors[0];
      scored = rows.map((j, i) => {
        const semantic = Math.max(0, _cosine(abstractVec, vectors[i + 1]));
        const sjrNorm = (Number(j.sjr_score) || 0) / maxSjr;
        // Semantic scope-fit is the primary signal; SJR is a light prestige tiebreak.
        return { j, semantic, composite: semantic + 0.12 * sjrNorm };
      });
    } else {
      // fallback: SJR-only ordering
      scored = rows.map((j) => ({ j, semantic: 0, composite: (Number(j.sjr_score) || 0) / maxSjr }));
    }
    scored.sort((a, b) => b.composite - a.composite);

    const data = scored.slice(0, limit).map(({ j, semantic }) => ({
      title: j.name,
      issn: j.issn,
      subject: j.category,
      sjr: j.sjr_score != null ? Number(j.sjr_score) : null,
      impact_factor: j.impact_factor != null ? Number(j.impact_factor) : null,
      h_index: j.h_index,
      country: j.country,
      publisher: j.publisher,
      quartile: j.quality_tier,
      open_access: j.is_open_access === true,
      homepage_url: j.homepage_url,
      doaj_url: j.doaj_url,
      fit_score: Math.round(semantic * 100),     // semantic scope-match 0..100
      source: 'scimago',
    }));

    res.status(200).json({ success: true, data, total: data.length, keywords, source: 'scimago',
      ranked_by: (Array.isArray(vectors)) ? 'abstract-embedding' : 'sjr' });
  } catch (err) {
    logger.error('[Publications] recommend-journals failed:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** Live DOAJ journal search (open-access). Returns the normalized journal shape. */
exports._queryDoaj = async (query, limit = 20) => {
  const url = `https://doaj.org/api/v2/search/journals/${encodeURIComponent(query)}?pageSize=${Math.min(limit, 50)}`;
  const resp = await axios.get(url, { timeout: 8000 });
  const results = resp.data?.results || [];
  return results.map((r) => {
    const b = r.bibjson || {};
    return {
      title: b.title || 'Unknown',
      issn: (b.pissn || b.eissn || (b.identifier || []).map((x) => x.id)[0]) || null,
      subject: (b.subject || []).map((s) => s.term).join(', ') || null,
      sjr: null,
      impact_factor: null,
      h_index: null,
      country: b.publisher?.country || null,
      publisher: b.publisher?.name || null,
      quartile: null,
      open_access: true,
      homepage_url: (b.link || []).find((l) => l.type === 'homepage')?.url || null,
      doaj_url: `https://doaj.org/toc/${b.pissn || b.eissn || ''}`,
      source: 'doaj',
    };
  });
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
