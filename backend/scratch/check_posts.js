const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function run() {
  try {
    const res = await pool.query('SELECT DISTINCT type FROM community_posts');
    console.log('Distinct post types:', res.rows);
    
    const constraints = await pool.query(`
      SELECT conname, pg_get_constraintdef(c.oid) 
      FROM pg_constraint c 
      JOIN pg_namespace n ON n.oid = c.connamespace 
      WHERE conrelid = 'community_posts'::regclass;
    `);
    console.log('Constraints on community_posts:', constraints.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
