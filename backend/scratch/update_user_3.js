const db = require('../src/config/db');
require('dotenv').config();

async function updateProfile() {
  try {
    await db.query(`
      UPDATE users 
      SET personal_website = 'https://mostofarezvi.com', 
          linkedin_url = 'https://linkedin.com/in/mostofarezvi',
          educational_status = 'PhD Researcher',
          institution = 'University of Smart Research'
      WHERE id = 3
    `);
    console.log('User 3 updated successfully');
  } catch (err) {
    console.error('Error updating user:', err);
  } finally {
    process.exit();
  }
}

updateProfile();
