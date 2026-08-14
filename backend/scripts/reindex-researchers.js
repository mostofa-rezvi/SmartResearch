/**
 * reindex-researchers.js
 * ---------------------------------------------------------------------------
 * Backfill the Elasticsearch `users` index (the one the AI Assistant searches
 * for "who works on X" questions) from the `users` table in Postgres.
 *
 * WHY THIS EXISTS
 * The search-sync worker only indexes a profile when a live `profile.created`
 * event is published (i.e. on real sign-up / profile edit). Accounts created by
 * the demo seeders — e.g. Dr. Aisha Rahman (NLP / low-resource languages),
 * Dr. Chen Wei (graph neural networks) — never fired that event, so they were
 * missing from the `users` index. The assistant then matched only a handful of
 * empty test accounts and answered "I couldn't find any relevant information".
 *
 * This script rebuilds a rich, embeddable profile string (name · institution ·
 * research interests · skills · bio) for every real user, embeds it via the ML
 * service (same 768-dim SBERT space as content search), and upserts it into the
 * `users` index with a human-readable `content` field so the assistant can both
 * FIND the researcher (vector match) and SHOW a meaningful snippet + why.
 *
 * Idempotent: upserts by user id, so re-running just refreshes the vectors.
 *
 * Usage (from backend/):
 *   node scripts/reindex-researchers.js
 *   ONLY_WITH_INTERESTS=1 node scripts/reindex-researchers.js   # skip bare accounts
 * ---------------------------------------------------------------------------
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const axios = require('axios');
const db = require('../src/config/db');
const { initElasticsearch, getEsClient } = require('../src/config/elasticsearch');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
const ONLY_WITH_INTERESTS = process.env.ONLY_WITH_INTERESTS === '1';

/** research_interests is stored as either ["a","b"] or {"interests":["a","b"]}. */
function parseInterests(raw) {
  if (!raw) return [];
  let v = raw;
  if (typeof v === 'string') {
    try { v = JSON.parse(v); } catch { return [v]; }
  }
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  if (v && Array.isArray(v.interests)) return v.interests.filter(Boolean).map(String);
  return [];
}

function parseArray(raw) {
  if (!raw) return [];
  let v = raw;
  if (typeof v === 'string') {
    try { v = JSON.parse(v); } catch { return [v]; }
  }
  return Array.isArray(v) ? v.filter(Boolean).map(String) : [];
}

async function embed(text) {
  if (!text || !text.trim()) return null;
  try {
    const res = await axios.post(`${ML_SERVICE_URL}/embed`, { text }, { timeout: 60000 });
    return res.data?.embedding || res.data?.vectors || null;
  } catch (err) {
    console.warn(`   ! embed failed: ${err.message}`);
    return null;
  }
}

(async () => {
  try {
    initElasticsearch();
    const es = getEsClient();

    const { rows } = await db.query(
      `SELECT id, name, email, institution, bio, research_interests, domain_tags, skills,
              researcher_type, trust_tier
         FROM users
        WHERE COALESCE(status, 'active') <> 'deleted'
        ORDER BY id`
    );

    let indexed = 0, skipped = 0, noVec = 0;
    for (const u of rows) {
      const interests = parseInterests(u.research_interests);
      const tags = parseArray(u.domain_tags);
      const skills = parseArray(u.skills);

      // Skip obviously-empty test rows unless they carry *some* signal.
      const hasSignal = interests.length || tags.length || skills.length || (u.bio && u.bio.trim());
      if (ONLY_WITH_INTERESTS && !hasSignal) { skipped++; continue; }

      // Rich, human-readable profile line — doubles as the embedding input and
      // the snippet the assistant shows under "Sources".
      const parts = [];
      if (u.institution) parts.push(`${u.institution}`);
      if (interests.length) parts.push(`Research interests: ${interests.join(', ')}`);
      if (skills.length) parts.push(`Skills: ${skills.join(', ')}`);
      if (tags.length) parts.push(`Domains: ${tags.join(', ')}`);
      if (u.bio && u.bio.trim()) parts.push(u.bio.trim());
      const content = parts.join('. ');

      // Embed name + full profile so both the person and their topics match.
      const embedText = [u.name, content].filter(Boolean).join('. ');
      const embedding = await embed(embedText);
      if (!embedding) noVec++;

      const doc = {
        name: u.name || 'Unknown',
        email: u.email || '',
        content,
        institution: u.institution || '',
        interests,
        trust_tier: u.trust_tier || 'unverified',
        tags,
      };
      if (Array.isArray(embedding) && embedding.length > 0) doc.embedding = embedding;

      await es.index({ index: 'users', id: String(u.id), document: doc });
      indexed++;
      const label = interests.length ? `[${interests.slice(0, 3).join(', ')}]` : '(no interests)';
      console.log(`  ✓ #${u.id} ${u.name} ${label}${embedding ? '' : ' (no vector)'}`);
    }

    await es.indices.refresh({ index: 'users' }).catch(() => {});

    console.log('\n──────────── Researcher re-index complete ────────────');
    console.log(`  Indexed:        ${indexed}`);
    console.log(`  Skipped (bare): ${skipped}`);
    console.log(`  Without vector: ${noVec}${noVec ? ' (ML /embed unreachable — matches will be weak)' : ''}`);
    console.log('  Try it:         /assistant → "Who works on low-resource NLP?"');
    console.log('──────────────────────────────────────────────────────');
    process.exit(0);
  } catch (err) {
    console.error('✗ reindex-researchers failed:', err.message);
    process.exit(1);
  }
})();
