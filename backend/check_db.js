const db = require('./src/config/db');

async function checkPosts() {
  try {
    const res = await db.query('SELECT COUNT(*) FROM community_posts');
    console.log('Total posts in community_posts:', res.rows[0].count);
    
    const sample = await db.query('SELECT * FROM community_posts LIMIT 5');
    console.log('Sample posts:', JSON.stringify(sample.rows, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('Error checking posts:', err);
    process.exit(1);
  }
}

checkPosts();
