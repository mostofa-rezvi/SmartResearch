const axios = require('axios');
const { Pool } = require('pg');
const Redis = require('ioredis');
const { Client } = require('@elastic/elasticsearch');
const neo4j = require('neo4j-driver');
const config = require('../config/index');

describe('Infrastructure Integration Tests', () => {
  test('PostgreSQL Connection', async () => {
    const pool = new Pool({ connectionString: config.db.url });
    const res = await pool.query('SELECT NOW()');
    expect(res.rows.length).toBe(1);
    await pool.end();
  });

  test('Redis Connection', async () => {
    const redis = new Redis(config.redis.url);
    const res = await redis.ping();
    expect(res).toBe('PONG');
    await redis.quit();
  });

  test('Elasticsearch Connection', async () => {
    const client = new Client({ node: config.elasticsearch.node });
    const res = await client.ping();
    expect(res).toBe(true);
  });

  test('Neo4j Connection', async () => {
    const [user, password] = config.neo4j.auth.split('/');
    const driver = neo4j.driver(config.neo4j.uri, neo4j.auth.basic(user, password));
    const session = driver.session();
    try {
      const res = await session.run('RETURN 1 as val');
      expect(res.records[0].get('val').toNumber()).toBe(1);
    } finally {
      await session.close();
      await driver.close();
    }
  });

  test('ML Service Connectivity', async () => {
    const res = await axios.get(`${config.mlService.url}/health`);
    expect(res.data.status).toBe('ok');
  });
});
