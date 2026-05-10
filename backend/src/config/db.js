const { Pool, types } = require('pg');
const config = require('./index');

// Postgres `timestamp without time zone` is mapped to OID 1114.
// By default pg parses it as local time. We override to parse as UTC.
types.setTypeParser(1114, str => new Date(str + 'Z'));

const pool = new Pool({
  connectionString: config.db.url,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};

