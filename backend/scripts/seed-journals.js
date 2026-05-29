/**
 * seed-journals.js
 * ---------------------------------------------------------------
 * Fetches journal metadata from DOAJ API and populates the local DB.
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

const CATEGORIES = [
  "Medicine", "Biology", "Physics", "Chemistry", "Computer Science", 
  "Social Sciences", "Economics", "Engineering", "Mathematics", "Law"
];

async function fetchJournalsByCategory(category, page = 1) {
  const url = `https://doaj.org/api/search/journals/(bibjson.subject.term:${encodeURIComponent(category)})?pageSize=50&page=${page}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  return json.results || [];
}

async function main() {
  console.log("📚 Seeding Journals from DOAJ API...");
  const client = await pool.connect();
  
  try {
    let total = 0;
    for (const cat of CATEGORIES) {
      console.log(`🔍 Fetching: ${cat}`);
      
      // Fetch 2 pages per category to hit 1000+ target (10 categories * 2 pages * 50 = 1000)
      for (let page = 1; page <= 2; page++) {
        const results = await fetchJournalsByCategory(cat, page);
        
        for (const item of results) {
          const j = item.bibjson;
          const name = j.title ? j.title.substring(0, 500) : "Unknown Journal";
          const issn = j.eissn || j.pissn || (j.identifier && j.identifier[0] ? j.identifier[0].id : null);
          const rawPublisher = j.publisher?.name || "Unknown Publisher";
          const publisher = rawPublisher.substring(0, 100);
          const url = j.link?.[0]?.url || "";
          
          // Mock impact factor and tier as DOAJ doesn't provide SJR directly
          const impact = (Math.random() * 5 + 0.5).toFixed(2);
          const tier = impact > 3 ? 'Q1' : (impact > 1.5 ? 'Q2' : 'Q3');

          await client.query(
            `INSERT INTO journals (name, issn, category, subcategory, quality_tier, impact_factor, website_url, institutional_group, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'approved')
             ON CONFLICT DO NOTHING`,
            [name, issn, cat, null, tier, impact, url, publisher]
          );
          total++;
        }
      }
      console.log(`   ✅ Added up to page 2 for ${cat} (Total so far: ${total})`);
    }
    console.log(`\n🎉 Total journals seeded: ${total}`);
  } catch (err) {
    console.error("❌ Seed failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
