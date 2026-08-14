/**
 * seed-library.js
 * ---------------------------------------------------------------------------
 * Populate the Knowledge Library ("My Library" + "Discover") with realistic
 * sample items so the section isn't empty on a fresh account.
 *
 *  - Seeds a curated set of items (papers, datasets, notes, literature reviews)
 *    OWNED BY a target user  → fills that user's "My Library" tab.
 *  - Seeds a handful of SHARED items owned by demo researchers → fills the
 *    "Discover" tab with variety across owners.
 *
 * Idempotent: an item is inserted only if the same (user, title) doesn't exist.
 *
 * Usage (from backend/):
 *   node scripts/seed-library.js
 *   LIBRARY_EMAIL=you@school.edu node scripts/seed-library.js
 *
 * NOTE: this inserts straight into Postgres, so items show up in the LIST and
 * DISCOVER views immediately. Semantic *search* additionally needs the item
 * indexed in Elasticsearch (done automatically when you add items through the
 * UI while the ML service is running).
 * ---------------------------------------------------------------------------
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/config/db');
const libraryService = require('../src/services/library.service');
const { initElasticsearch } = require('../src/config/elasticsearch');

// Set INDEX=0 to skip Elasticsearch/ML indexing (DB rows only).
const DO_INDEX = process.env.INDEX !== '0';

const TARGET_EMAIL = (process.env.LIBRARY_EMAIL || 'mostofa.aminur.rezvi@gmail.com').toLowerCase().trim();

// Items owned by the target user → their "My Library".
const MY_ITEMS = [
  {
    item_type: 'paper',
    title: 'Attention Is All You Need: A Practical Re-reading for Applied NLP',
    abstract:
      'Notes and annotations on the transformer architecture, focusing on the multi-head self-attention mechanism and its implications for downstream fine-tuning. Highlights positional encoding trade-offs and inference-time cost.',
    authors: 'Vaswani, A.; Shazeer, N.; Parmar, N.',
    doi: '10.48550/arXiv.1706.03762',
    tags: ['transformers', 'attention', 'nlp', 'deep-learning'],
    is_shared: true,
  },
  {
    item_type: 'paper',
    title: 'Retrieval-Augmented Generation for Knowledge-Intensive Tasks',
    abstract:
      'Combines a parametric seq2seq model with a non-parametric dense retriever over Wikipedia. Useful reference for building RAG pipelines; captures the marginalization over retrieved passages.',
    authors: 'Lewis, P.; Perez, E.; Piktus, A.',
    doi: '10.48550/arXiv.2005.11401',
    tags: ['rag', 'retrieval', 'llm', 'question-answering'],
    is_shared: true,
  },
  {
    item_type: 'dataset',
    title: 'Open Citation Graph Snapshot (2024 Q3) — cleaned edges',
    abstract:
      'Deduplicated citation edge list derived from OpenAlex works, filtered to peer-reviewed venues. ~48M nodes / 610M edges. Parquet, partitioned by publication year. Used for GNN trust-rank experiments.',
    authors: 'Compiled locally',
    doi: null,
    tags: ['dataset', 'citation-graph', 'openalex', 'parquet'],
    is_shared: false,
  },
  {
    item_type: 'note',
    title: 'Idea: semantic dedup of library items before embedding',
    abstract:
      'Before indexing, cluster near-duplicate titles/abstracts (MinHash + cosine on SBERT) so the recommender is not skewed by the same paper saved twice. TODO: pick a similarity threshold empirically.',
    authors: null,
    doi: null,
    tags: ['idea', 'embeddings', 'dedup', 'todo'],
    is_shared: false,
  },
  {
    item_type: 'literature_review',
    title: 'Survey: Vector Databases for Semantic Search (2022–2024)',
    abstract:
      'Comparative review of HNSW-based stores (FAISS, Elasticsearch kNN, pgvector, Milvus). Covers recall/latency trade-offs, hybrid keyword+vector scoring, and filtering strategies for multi-tenant corpora.',
    authors: 'Personal review',
    doi: null,
    tags: ['literature-review', 'vector-search', 'hnsw', 'elasticsearch'],
    is_shared: true,
  },
  {
    item_type: 'paper',
    title: 'Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks',
    abstract:
      'The embedding backbone behind our semantic search. Reduces the cost of pairwise similarity from BERT cross-encoders while keeping strong STS performance. Reference for the 384-d MiniLM variant.',
    authors: 'Reimers, N.; Gurevych, I.',
    doi: '10.18653/v1/D19-1410',
    tags: ['sbert', 'embeddings', 'semantic-search'],
    is_shared: true,
  },
  {
    item_type: 'dataset',
    title: 'Journal Quality Tiers — SJR/SCImago merge (1999–2025)',
    abstract:
      'Harmonized journal metadata: ISSN, SJR score, quartile tier, H-index, open-access flag, publisher, region. Backing table for the Library journal catalog and the publication recommender.',
    authors: 'Compiled from SCImago',
    doi: null,
    tags: ['dataset', 'journals', 'scimago', 'bibliometrics'],
    is_shared: true,
  },
  {
    item_type: 'note',
    title: 'Meeting notes — recommender evaluation metrics',
    abstract:
      'Agreed to track Recall@10 and nDCG@10 against a held-out set of user saves. Log match-quality scores per recommendation so we can A/B the embedding model later.',
    authors: null,
    doi: null,
    tags: ['note', 'meeting', 'recommender', 'metrics'],
    is_shared: false,
  },
];

// Shared items owned by demo researchers → populate the "Discover" tab.
const SHARED_BY_DEMO = [
  {
    ownerEmail: 'aisha.rahman@demo.researchbridge.test',
    item_type: 'paper',
    title: 'Graph Neural Networks for Author Disambiguation at Scale',
    abstract:
      'A GNN approach to resolving ambiguous author identities across bibliographic records using co-authorship and citation context. Reports gains over rule-based blocking on a 12M-record benchmark.',
    authors: 'Rahman, A.; Feld, M.',
    doi: '10.1145/3534678.3539301',
    tags: ['gnn', 'author-disambiguation', 'bibliometrics'],
  },
  {
    ownerEmail: 'chen.wei@demo.researchbridge.test',
    item_type: 'literature_review',
    title: 'A Review of Trust and Reputation Models in Scholarly Networks',
    abstract:
      'Surveys PageRank-style trust propagation, peer-endorsement, and reviewer-reliability models, and how they map onto researcher credibility scoring in modern research platforms.',
    authors: 'Wei, C.',
    doi: null,
    tags: ['trust', 'reputation', 'pagerank', 'review'],
  },
  {
    ownerEmail: 'sofia.almeida@demo.researchbridge.test',
    item_type: 'dataset',
    title: 'Climate Modeling Abstracts Corpus (labeled by subfield)',
    abstract:
      'A curated corpus of 40k climate-science abstracts with subfield labels (oceanography, atmospheric, cryosphere). Useful for topic-classification and domain-adaptation experiments.',
    authors: 'Almeida, S.',
    doi: null,
    tags: ['dataset', 'climate', 'nlp', 'classification'],
  },
  {
    ownerEmail: 'omar.haddad@demo.researchbridge.test',
    item_type: 'paper',
    title: 'Dense Passage Retrieval for Open-Domain Question Answering',
    abstract:
      'Learns dense embeddings for passages and questions with a dual-encoder, outperforming BM25 on open-domain QA retrieval. Foundational reading for hybrid retrieval design.',
    authors: 'Karpukhin, V.; Oğuz, B.',
    doi: '10.18653/v1/2020.emnlp-main.550',
    tags: ['dpr', 'retrieval', 'qa', 'dual-encoder'],
  },
];

async function getUserId(email) {
  const r = await db.query('SELECT id, name FROM users WHERE lower(email) = $1', [email]);
  return r.rows[0] || null;
}

async function insertItem(userId, it) {
  const dup = await db.query(
    'SELECT id FROM library_items WHERE user_id = $1 AND title = $2',
    [userId, it.title]
  );
  if (dup.rows.length) return false;
  await db.query(
    `INSERT INTO library_items (user_id, item_type, title, abstract, authors, doi, tags, is_shared)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      userId,
      it.item_type,
      it.title,
      it.abstract || null,
      it.authors || null,
      it.doi || null,
      JSON.stringify(it.tags || []),
      it.is_shared !== false,
    ]
  );
  return true;
}

/**
 * Best-effort semantic indexing: embed (ML service) + index into ES `papers`
 * so the item is findable via the semantic search box. Reuses the exact same
 * path the app uses when you add items through the UI. Never fails the seed —
 * if ML/ES are down, the item still lives in Postgres and shows in the lists.
 */
async function indexByUserTitle(userId, title) {
  const r = await db.query(
    `SELECT id, user_id, item_type, title, abstract, authors, doi, tags, full_text
       FROM library_items WHERE user_id = $1 AND title = $2`,
    [userId, title]
  );
  if (!r.rows.length) return false;
  await libraryService._indexItem(r.rows[0]);
  return true;
}

(async () => {
  try {
    const target = await getUserId(TARGET_EMAIL);
    if (!target) {
      console.error(`✗ No user with email "${TARGET_EMAIL}".`);
      console.error('  Pass the account you are signed in as:');
      console.error("  LIBRARY_EMAIL=you@school.edu node scripts/seed-library.js");
      process.exit(1);
    }

    let mine = 0;
    for (const it of MY_ITEMS) if (await insertItem(target.id, it)) mine++;

    let shared = 0, skippedOwners = 0;
    for (const it of SHARED_BY_DEMO) {
      const owner = await getUserId(it.ownerEmail);
      if (!owner) { skippedOwners++; continue; }
      if (await insertItem(owner.id, { ...it, is_shared: true })) shared++;
    }

    // Semantic indexing pass — makes every curated item findable via search.
    // Runs over the full set (not just new inserts) so re-runs backfill anything
    // that was seeded before indexing was wired.
    let indexed = 0, indexFail = 0;
    if (DO_INDEX) {
      // The ES client is a lazily-initialized singleton created at server
      // startup; a standalone script must initialize it itself.
      try { initElasticsearch(); } catch { /* falls through to indexFail below */ }
      for (const it of MY_ITEMS) {
        try { if (await indexByUserTitle(target.id, it.title)) indexed++; }
        catch { indexFail++; }
      }
      for (const it of SHARED_BY_DEMO) {
        const owner = await getUserId(it.ownerEmail);
        if (!owner) continue;
        try { if (await indexByUserTitle(owner.id, it.title)) indexed++; }
        catch { indexFail++; }
      }
    }

    console.log('\n──────────────── Knowledge Library seeded ────────────────');
    console.log(`  My Library owner:  ${target.name} <${TARGET_EMAIL}> (#${target.id})`);
    console.log(`  My Library items:  +${mine} (of ${MY_ITEMS.length})`);
    console.log(`  Discover (shared): +${shared} (of ${SHARED_BY_DEMO.length}${skippedOwners ? `, ${skippedOwners} demo owners missing` : ''})`);
    if (DO_INDEX) {
      console.log(`  Semantic index:    ${indexed} indexed${indexFail ? `, ${indexFail} failed (ML/ES down?)` : ''}`);
    } else {
      console.log('  Semantic index:    skipped (INDEX=0)');
    }
    console.log('  View at:           /library  →  "My Library" tab');
    console.log('──────────────────────────────────────────────────────────');
    process.exit(0);
  } catch (err) {
    console.error('✗ seed-library failed:', err.message);
    process.exit(1);
  }
})();
