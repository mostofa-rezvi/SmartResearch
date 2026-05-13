const db = require('./src/config/db');

async function checkSchema() {
  try {
    const res = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'invited_user_profiles'
    `);
    console.log('invited_user_profiles schema:', JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error checking schema:', err);
    process.exit(1);
  }
}

checkSchema();
