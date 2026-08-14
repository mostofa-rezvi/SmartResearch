/**
 * dedupe-library.js
 * ---------------------------------------------------------------------------
 * Remove duplicate library items (and their Elasticsearch `papers` docs) that
 * accumulate when seed scripts are run more than once or for multiple owners
 * (e.g. the same "Attention Is All You Need" saved under two users).
 *
 * A duplicate is any item sharing another item's DOI, or — when there's no DOI —
 * its normalized (case/whitespace-folded) title. The EARLIEST row (smallest id)
 * is kept; the rest are deleted from Postgres and from the ES `papers` index.
 *
 * Safe: `library_items` has no foreign-key dependents. Idempotent: a second run
 * finds nothing to remove.
 *
 * Usage (from backend/):
 *   node scripts/dedupe-library.js
 *   DRY_RUN=1 node scripts/dedupe-library.js     # report what would be removed
 * ---------------------------------------------------------------------------
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/config/db');
const { initElasticsearch, getEsClient } = require('../src/config/elasticsearch');

const DRY_RUN = process.env.DRY_RUN === '1';

async function idsToRemove() {
  // Rank within each duplicate group by id ascending; anything after the first
  // (rn > 1) is a duplicate to drop. DOI takes priority; fall back to title.
  const res = await db.query(`
    WITH keyed AS (
      SELECT id,
             CASE
               WHEN doi IS NOT NULL AND btrim(doi) <> ''
                 THEN 'doi:' || lower(btrim(doi))
               ELSE 'title:' || lower(regexp_replace(btrim(title), '\\s+', ' ', 'g'))
             END AS dedup_key
      FROM library_items
    ),
    ranked AS (
      SELECT id, dedup_key,
             row_number() OVER (PARTITION BY dedup_key ORDER BY id) AS rn
      FROM keyed
    )
    SELECT id FROM ranked WHERE rn > 1 ORDER BY id;
  `);
  return res.rows.map((r) => r.id);
}

(async () => {
  try {
    const ids = await idsToRemove();

    if (ids.length === 0) {
      console.log('✓ No duplicate library items found — nothing to remove.');
      process.exit(0);
    }

    if (DRY_RUN) {
      console.log(`DRY RUN — ${ids.length} duplicate item(s) would be removed:`);
      console.log(`  ids: ${ids.join(', ')}`);
      process.exit(0);
    }

    // Delete from Postgres.
    await db.query('DELETE FROM library_items WHERE id = ANY($1)', [ids]);

    // Delete the matching ES docs (best-effort; ignore missing).
    let esDeleted = 0, esMissing = 0;
    try {
      initElasticsearch();
      const es = getEsClient();
      for (const id of ids) {
        try {
          await es.delete({ index: 'papers', id: String(id) });
          esDeleted++;
        } catch (e) {
          if (e && e.meta && e.meta.statusCode === 404) esMissing++;
          else throw e;
        }
      }
    } catch (e) {
      console.warn(`  ! ES cleanup incomplete: ${e.message}`);
    }

    console.log('\n──────────────── Library de-duplicated ────────────────');
    console.log(`  Removed from Postgres: ${ids.length}`);
    console.log(`  Removed from ES index: ${esDeleted}${esMissing ? ` (${esMissing} already absent)` : ''}`);
    console.log('────────────────────────────────────────────────────────');
    process.exit(0);
  } catch (err) {
    console.error('✗ dedupe-library failed:', err.message);
    process.exit(1);
  }
})();
