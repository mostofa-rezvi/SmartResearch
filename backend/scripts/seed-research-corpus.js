/**
 * seed-research-corpus.js
 * ---------------------------------------------------------------------------
 * Download a REAL research-paper corpus from OpenAlex (https://openalex.org)
 * and ingest it so the AI Assistant, Discovery, and semantic search return
 * real-world, citable results instead of the handful of demo rows.
 *
 * For each topic it queries OpenAlex for the most relevant open-access works
 * (with abstracts), reconstructs each abstract from OpenAlex's inverted index,
 * inserts them into `library_items` (Postgres), then indexes them into the
 * Elasticsearch `papers` index via the SAME path the app uses when you add a
 * paper through the UI (libraryService._indexItem → ML /embed → ES).
 *
 * OpenAlex is free and needs no API key. Providing a contact email (the
 * "polite pool") is recommended and just makes requests faster/more reliable.
 *
 * Idempotent: a paper is inserted only if the same (user, title) doesn't exist,
 * so re-running tops up the corpus without creating duplicates.
 *
 * Usage (from backend/):
 *   node scripts/seed-research-corpus.js
 *   CORPUS_EMAIL=you@school.edu node scripts/seed-research-corpus.js
 *   PER_TOPIC=10 node scripts/seed-research-corpus.js
 *   OPENALEX_MAILTO=you@school.edu node scripts/seed-research-corpus.js
 *   INDEX=0 node scripts/seed-research-corpus.js      # DB rows only, skip ES/ML
 *   DRY_RUN=1 node scripts/seed-research-corpus.js     # fetch + print, no writes
 * ---------------------------------------------------------------------------
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const axios = require('axios');

const DRY_RUN = process.env.DRY_RUN === '1';
const DO_INDEX = process.env.INDEX !== '0' && !DRY_RUN;
const PER_TOPIC = Math.max(1, Math.min(50, parseInt(process.env.PER_TOPIC || '6', 10)));
const TARGET_EMAIL = (process.env.CORPUS_EMAIL || process.env.LIBRARY_EMAIL ||
  'mostofa.aminur.rezvi@gmail.com').toLowerCase().trim();
const MAILTO = process.env.OPENALEX_MAILTO || 'support@researchbridge.local';

// Lazily required so DRY_RUN works with no DB/ML/ES available.
let db, libraryService, initElasticsearch;
if (!DRY_RUN) {
  db = require('../src/config/db');
  libraryService = require('../src/services/library.service');
  ({ initElasticsearch } = require('../src/config/elasticsearch'));
}

// Topics span the questions users actually ask the assistant. Each maps to a
// tag on the ingested papers so they are also filterable in the Library.
const TOPICS = [
  'machine learning', 'deep learning', 'neural networks',
  'natural language processing', 'transformer neural network', 'large language models',
  'computer vision', 'image classification', 'object detection', 'image segmentation',
  'reinforcement learning', 'generative adversarial networks', 'diffusion models',
  'graph neural networks', 'self-supervised learning', 'transfer learning', 'few-shot learning',
  'federated learning', 'differential privacy',
  'information retrieval', 'retrieval augmented generation', 'dense passage retrieval',
  'sentence embeddings', 'approximate nearest neighbor search', 'vector database',
  'recommender systems', 'knowledge graphs', 'question answering',
  'speech recognition', 'multimodal learning', 'contrastive learning',
  'explainable artificial intelligence', 'algorithmic fairness', 'model interpretability',
  'named entity recognition', 'machine translation', 'text summarization',
  'semantic search', 'time series forecasting', 'anomaly detection',
];

const OPENALEX = 'https://api.openalex.org/works';

/** Reconstruct a plain-text abstract from OpenAlex's inverted index. */
function abstractFromInverted(inv) {
  if (!inv || typeof inv !== 'object') return '';
  const slots = [];
  for (const [word, positions] of Object.entries(inv)) {
    for (const p of positions) slots.push([p, word]);
  }
  slots.sort((a, b) => a[0] - b[0]);
  return slots.map((s) => s[1]).join(' ')
    .replace(/<[^>]+>/g, ' ')   // strip stray HTML tags (e.g. <i>, <sub>) from source abstracts
    .replace(/\s+/g, ' ')
    .trim();
}

/** "Doe, J.; Smith, A." style author string, capped, with "et al." overflow. */
function formatAuthors(authorships) {
  const names = (authorships || [])
    .map((a) => a && a.author && a.author.display_name)
    .filter(Boolean);
  if (names.length === 0) return null;
  const shown = names.slice(0, 4).join('; ');
  return names.length > 4 ? `${shown}; et al.` : shown;
}

/** Strip the resolver prefix so DOIs match the existing seed format (10.xxxx/...). */
function bareDoi(doi) {
  if (!doi) return null;
  return String(doi).replace(/^https?:\/\/(dx\.)?doi\.org\//i, '') || null;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

/** GET with exponential backoff on 429 (OpenAlex rate limiting). */
async function getWithRetry(url, params, tries = 5) {
  let delay = 2000;
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      return await axios.get(url, { params, timeout: 30000 });
    } catch (e) {
      const status = e.response && e.response.status;
      if (status === 429 && attempt < tries) {
        await sleep(delay);
        delay = Math.min(delay * 2, 16000);
        continue;
      }
      throw e;
    }
  }
}

/** Fetch up to PER_TOPIC relevant, abstract-bearing journal articles for a topic. */
async function fetchTopic(topic) {
  const params = {
    search: topic,
    filter: 'has_abstract:true,type:article',
    per_page: PER_TOPIC,
    select: 'id,title,abstract_inverted_index,authorships,doi,publication_year,cited_by_count,primary_location',
    mailto: MAILTO,
  };
  const res = await getWithRetry(OPENALEX, params);
  const results = (res.data && res.data.results) || [];
  const items = [];
  for (const w of results) {
    const title = (w.title || '').trim();
    const abstract = abstractFromInverted(w.abstract_inverted_index);
    if (!title || !abstract) continue;
    const venue = w.primary_location && w.primary_location.source && w.primary_location.source.display_name;
    const year = w.publication_year;
    const cites = w.cited_by_count;
    // A compact provenance line makes answers read like real citations.
    const meta = [venue, year ? `(${year})` : null, Number.isFinite(cites) ? `${cites} citations` : null]
      .filter(Boolean).join(' ');
    items.push({
      item_type: 'paper',
      title,
      abstract: meta ? `${abstract}\n\nSource: ${meta}.` : abstract,
      authors: formatAuthors(w.authorships),
      doi: bareDoi(w.doi),
      tags: [topic],
      is_shared: true,
    });
  }
  return items;
}

async function getUserId(email) {
  const r = await db.query('SELECT id, name FROM users WHERE lower(email) = $1', [email]);
  return r.rows[0] || null;
}

async function insertItem(userId, it) {
  // Global de-dup: skip if this paper already exists for ANY user — matched by
  // DOI when present, and always by normalized (case/whitespace-folded) title.
  // Prevents cross-run and cross-owner duplicates in search results.
  const dup = await db.query(
    `SELECT id FROM library_items
      WHERE ($1 <> '' AND lower(btrim(doi)) = lower(btrim($1)))
         OR lower(regexp_replace(btrim(title), '\\s+', ' ', 'g'))
            = lower(regexp_replace(btrim($2), '\\s+', ' ', 'g'))
      LIMIT 1`,
    [it.doi || '', it.title]
  );
  if (dup.rows.length) return null;
  const r = await db.query(
    `INSERT INTO library_items (user_id, item_type, title, abstract, authors, doi, tags, is_shared)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, user_id, item_type, title, abstract, authors, doi, tags, full_text`,
    [userId, it.item_type, it.title, it.abstract || null, it.authors || null,
     it.doi || null, JSON.stringify(it.tags || []), it.is_shared !== false]
  );
  return r.rows[0];
}

(async () => {
  // ── DRY RUN: fetch and print, touch nothing. ────────────────────────────────
  if (DRY_RUN) {
    let total = 0;
    for (const topic of TOPICS.slice(0, 3)) {
      try {
        const items = await fetchTopic(topic);
        total += items.length;
        console.log(`\n■ ${topic} — ${items.length} papers`);
        for (const it of items.slice(0, 3)) {
          console.log(`   • ${it.title}`);
          console.log(`     authors: ${it.authors || '—'} | doi: ${it.doi || '—'}`);
          console.log(`     ${it.abstract.slice(0, 140).replace(/\n/g, ' ')}…`);
        }
        await sleep(200);
      } catch (e) {
        console.log(`   ✗ ${topic}: ${e.message}`);
      }
    }
    console.log(`\nDRY RUN ok — fetched ${total} papers from 3 sample topics (no writes).`);
    process.exit(0);
  }

  try {
    const target = await getUserId(TARGET_EMAIL);
    if (!target) {
      console.error(`✗ No user with email "${TARGET_EMAIL}".`);
      console.error('  Pass the account you are signed in as:');
      console.error('  CORPUS_EMAIL=you@school.edu node scripts/seed-research-corpus.js');
      process.exit(1);
    }

    if (DO_INDEX) {
      try { initElasticsearch(); } catch { /* indexing failures are reported below */ }
    }

    let fetched = 0, inserted = 0, indexed = 0, indexFail = 0, topicFail = 0;
    for (const topic of TOPICS) {
      let items = [];
      try {
        items = await fetchTopic(topic);
      } catch (e) {
        topicFail++;
        console.warn(`  ! ${topic}: fetch failed (${e.message})`);
        await sleep(300);
        continue;
      }
      fetched += items.length;

      for (const it of items) {
        let row;
        try { row = await insertItem(target.id, it); }
        catch (e) { console.warn(`  ! insert failed for "${it.title.slice(0, 48)}…": ${e.message}`); continue; }
        if (!row) continue; // duplicate
        inserted++;
        if (DO_INDEX) {
          try { await libraryService._indexItem(row); indexed++; }
          catch { indexFail++; }
        }
      }
      console.log(`  ✓ ${topic}: +${items.length} fetched`);
      await sleep(600); // be gentle with the public API (avoid 429s)
    }

    console.log('\n──────────────── Research corpus seeded ────────────────');
    console.log(`  Owner:            ${target.name} <${TARGET_EMAIL}> (#${target.id})`);
    console.log(`  Topics:           ${TOPICS.length}${topicFail ? ` (${topicFail} failed to fetch)` : ''}`);
    console.log(`  Papers fetched:   ${fetched}`);
    console.log(`  New papers added: ${inserted}`);
    if (DO_INDEX) {
      console.log(`  Semantic index:   ${indexed} indexed${indexFail ? `, ${indexFail} failed (ML/ES down?)` : ''}`);
    } else {
      console.log('  Semantic index:   skipped (INDEX=0)');
    }
    console.log('  Try it:           /assistant → "What are the current trends in AI research?"');
    console.log('────────────────────────────────────────────────────────');
    process.exit(0);
  } catch (err) {
    console.error('✗ seed-research-corpus failed:', err.message);
    process.exit(1);
  }
})();
