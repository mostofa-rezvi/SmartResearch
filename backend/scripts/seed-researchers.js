/**
 * seed-researchers.js
 * ---------------------------------------------------------------
 * Pulls researcher profiles from the free OpenAlex API and bulk-
 * inserts them into the local `researchers` table.
 *
 * Usage:
 *   node scripts/seed-researchers.js
 *   node scripts/seed-researchers.js --domain "biology" --pages 3
 *
 * Requirements: backend .env must be loaded (DB_USER, DB_HOST, etc.)
 * ---------------------------------------------------------------
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// --- Config ---
const DOMAINS = [
  'machine learning',
  'biomedical',
  'environmental science',
  'physics',
  'economics',
  'engineering',
  'psychology',
  'mathematics',
];

const PER_PAGE = 25;    // OpenAlex max per page
const PAGES_PER_DOMAIN = 2; // 25 × 2 × 8 domains = 400 possible, deduplicated to ~200
const MIN_CITATIONS = 300;
const MAILTO = 'research@researchbridge.app';

async function fetchAuthorsByDomain(domain, page) {
  const filter = `cited_by_count:>${MIN_CITATIONS}`;
  const url = `https://api.openalex.org/authors?filter=${encodeURIComponent(filter)}&search=${encodeURIComponent(domain)}&per-page=${PER_PAGE}&page=${page}&mailto=${MAILTO}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenAlex error: ${res.status} for domain "${domain}"`);
  const json = await res.json();
  return json.results || [];
}

function mapAuthor(author, domain) {
  return {
    openalex_id: author.id,
    orcid: author.orcid ? author.orcid.replace('https://orcid.org/', '') : null,
    name: author.display_name,
    institution: author.last_known_institution?.display_name || null,
    country_code: author.last_known_institution?.country_code || null,
    citation_count: author.cited_by_count || 0,
    works_count: author.works_count || 0,
    h_index: author.summary_stats?.h_index || null,
    research_domains: JSON.stringify(
      (author.x_concepts || []).slice(0, 5).map(c => c.display_name)
    ),
    profile_url: author.id,
    orcid_url: author.orcid || null,
  };
}

async function upsertResearcher(client, r) {
  await client.query(
    `INSERT INTO researchers
       (openalex_id, orcid, name, institution, country_code, citation_count,
        works_count, h_index, research_domains, profile_url, orcid_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (openalex_id) DO UPDATE SET
       name = EXCLUDED.name,
       institution = EXCLUDED.institution,
       country_code = EXCLUDED.country_code,
       citation_count = EXCLUDED.citation_count,
       works_count = EXCLUDED.works_count,
       h_index = EXCLUDED.h_index,
       research_domains = EXCLUDED.research_domains,
       updated_at = CURRENT_TIMESTAMP`,
    [
      r.openalex_id, r.orcid, r.name, r.institution, r.country_code,
      r.citation_count, r.works_count, r.h_index,
      r.research_domains, r.profile_url, r.orcid_url,
    ]
  );
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🔬 ResearchBridge — OpenAlex Researcher Seed Script');
  console.log('====================================================');

  // Run the migration first
  const migrationSQL = require('fs').readFileSync(
    require('path').resolve(__dirname, '../migrations/004_researchers_and_onboarding.sql'),
    'utf8'
  );

  const client = await pool.connect();
  try {
    console.log('📦 Running migration 004 (researchers + onboarding_questions)...');
    await client.query(migrationSQL);
    console.log('✅ Migration complete.\n');

    let totalInserted = 0;
    const seen = new Set();

    for (const domain of DOMAINS) {
      console.log(`🌐 Fetching researchers for domain: "${domain}"`);
      for (let page = 1; page <= PAGES_PER_DOMAIN; page++) {
        try {
          const authors = await fetchAuthorsByDomain(domain, page);
          let domainCount = 0;

          for (const author of authors) {
            if (seen.has(author.id)) continue;
            seen.add(author.id);

            const mapped = mapAuthor(author, domain);
            await upsertResearcher(client, mapped);
            domainCount++;
            totalInserted++;
          }

          console.log(`   Page ${page}: +${domainCount} researchers (total so far: ${totalInserted})`);
          await sleep(150); // Be polite to the OpenAlex API
        } catch (err) {
          console.error(`   ⚠️  Failed page ${page} for "${domain}": ${err.message}`);
        }
      }
    }

    console.log(`\n🎉 Done! Seeded ${totalInserted} researchers into the database.`);

    // Summary
    const countResult = await client.query('SELECT COUNT(*) FROM researchers');
    const qCount = await client.query('SELECT COUNT(*) FROM onboarding_questions');
    console.log(`📊 DB now has: ${countResult.rows[0].count} researchers | ${qCount.rows[0].count} onboarding questions`);

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
