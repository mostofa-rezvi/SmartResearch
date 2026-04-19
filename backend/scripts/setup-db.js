const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const setupDatabase = async () => {
  try {
    const schemaPath = path.join(__dirname, '../schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Connecting to PostgreSQL...');
    await pool.query(schema);
    console.log('Database schema applied successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error setting up database:', err.message);
    process.exit(1);
  }
};

setupDatabase();
