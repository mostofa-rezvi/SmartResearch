const db = require('../src/config/db');
require('dotenv').config();

async function checkTables() {
  try {
    const res = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables in database:');
    res.rows.forEach(row => console.log(`- ${row.table_name}`));
    
    const userCols = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log('\nColumns in users table:');
    userCols.rows.forEach(row => console.log(`- ${row.column_name} (${row.data_type})`));
    
  } catch (err) {
    console.error('Error checking tables:', err);
  } finally {
    process.exit();
  }
}

checkTables();
