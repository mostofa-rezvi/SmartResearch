const db = require('../src/config/db');
const userService = require('../src/services/users.service');
require('dotenv').config();

async function testProfiles() {
  try {
    for (const id of [1, 3]) {
      console.log(`\nTesting Profile ${id}:`);
      const profile = await userService.getProfile(id);
      console.log(`- Name: ${profile.name}`);
      console.log(`- Institution: ${profile.institution}`);
      console.log(`- Ed Status: ${profile.educational_status}`);
      console.log(`- Social links:`, {
        web: profile.personal_website,
        linkedin: profile.linkedin_url,
        scholar: profile.google_scholar_url,
        rg: profile.researchgate_url
      });
    }
  } catch (err) {
    console.error('Error testing profiles:', err);
  } finally {
    process.exit();
  }
}

testProfiles();
