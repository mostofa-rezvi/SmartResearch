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
    console.log('Database base schema applied successfully!');

    // Read and apply all migrations in the migrations folder
    const migrationsDir = path.join(__dirname, '../migrations');
    if (fs.existsSync(migrationsDir)) {
      console.log('Reading database migrations...');
      const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort(); // ensures 004, 005 run first

      for (const file of files) {
        console.log(`Applying migration: ${file}...`);
        const migrationPath = path.join(migrationsDir, file);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        await pool.query(migrationSQL);
        console.log(`✅ Migration ${file} applied successfully!`);
      }
    }
    
    console.log('🎉 Database setup and all migrations applied successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error setting up database:', err.message);
    process.exit(1);
  }
};

setupDatabase();
