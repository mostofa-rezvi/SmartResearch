const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const applyMigrations = async () => {
  try {
    console.log('Applying researcher profile migrations...');
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_website TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS google_scholar_url TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS researchgate_url TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS educational_status VARCHAR(100);
    `);
    console.log('Migrations applied successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exit(1);
  }
};

applyMigrations();
