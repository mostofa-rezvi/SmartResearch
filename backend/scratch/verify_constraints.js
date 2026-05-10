const { pool } = require('../src/config/db');

async function verify() {
  try {
    const result = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conrelid = 'group_members'::regclass AND contype = 'c';
    `);
    console.log('Constraints on group_members:');
    console.log(JSON.stringify(result.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Verification failed:', err);
    process.exit(1);
  }
}

verify();
