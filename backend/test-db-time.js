const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:5434/researchbridge',
});

async function test() {
  console.time('query');
  try {
    const res = await pool.query('SELECT 1');
    console.log('Result:', res.rows);
  } catch (err) {
    console.error('Error:', err);
  }
  console.timeEnd('query');
  await pool.end();
}

test();
