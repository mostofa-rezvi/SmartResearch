const db = require('./src/config/db');
const communityService = require('./src/services/community.service');

async function testGetFeed() {
  try {
    const users = await db.query('SELECT id FROM users LIMIT 1');
    if (users.rows.length === 0) {
      console.log('No users found');
      process.exit(0);
    }
    const userId = users.rows[0].id;
    console.log('Testing getFeed for userId:', userId);
    
    const feed = await communityService.getFeed(userId);
    console.log('Feed count:', feed.length);
    if (feed.length > 0) {
      console.log('First post:', JSON.stringify(feed[0], null, 2));
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error testing getFeed:', err);
    process.exit(1);
  }
}

testGetFeed();
