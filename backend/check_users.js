const db = require('./src/config/db');

async function checkUsers() {
  try {
    const res = await db.query('SELECT id, name FROM users');
    console.log('Users in DB:', JSON.stringify(res.rows, null, 2));
    
    const postUsers = await db.query('SELECT DISTINCT user_id FROM community_posts');
    console.log('User IDs in posts:', JSON.stringify(postUsers.rows, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('Error checking users:', err);
    process.exit(1);
  }
}

checkUsers();
