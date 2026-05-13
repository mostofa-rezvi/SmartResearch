const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkUsers() {
  try {
    const res = await pool.query('SELECT count(*) FROM users');
    console.log('Total users:', res.rows[0].count);
    const users = await pool.query('SELECT id, email, name FROM users LIMIT 5');
    console.log('Recent users:', users.rows);
    process.exit(0);
  } catch (err) {
    console.error('Error checking users:', err.message);
    process.exit(1);
  }
}

checkUsers();
