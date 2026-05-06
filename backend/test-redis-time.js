const Redis = require('ioredis');
const redis = new Redis('redis://127.0.0.1:6379');

async function test() {
  console.time('ping');
  try {
    const res = await redis.ping();
    console.log('Result:', res);
  } catch (err) {
    console.error('Error:', err);
  }
  console.timeEnd('ping');
  await redis.quit();
}

test();
