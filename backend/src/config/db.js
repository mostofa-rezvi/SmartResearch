const { Pool } = require('pg');
const config = require('./index');

const pool = new Pool({
  connectionString: config.db.url,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
