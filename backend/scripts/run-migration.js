/**
 * run-migration.js
 * Applies a SQL migration file to the configured Postgres database.
 * Usage: node scripts/run-migration.js <migration-file>
 */
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Usage: node scripts/run-migration.js <migration-file>');
  process.exit(1);
}

const sql = fs.readFileSync(path.resolve(migrationFile), 'utf8');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const client = await pool.connect();
  try {
    console.log(`Applying migration: ${migrationFile}`);
    await client.query(sql);
    console.log('✅ Migration applied successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
