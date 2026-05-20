const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
const redis = require('redis');

// Read the CSV manually since it's simple formatting
const csvPath = path.join(__dirname, '../../assets/researchers.csv');

// We will map OpenAlex IDs or generic interests to roles for ML similarity
const interestMapping = {
  'Computer Science': ['Machine Learning', 'Artificial Intelligence', 'Cybersecurity', 'Data Science & AI', 'Blockchain'],
  'Medicine': ['Public Health', 'Bioinformatics', 'Genetics', 'Neuroscience'],
  'Physics': ['Quantum Computing', 'Astrophysics', 'Materials Science'],
  'Biology': ['Genetics', 'Bioinformatics', 'Ecology'],
  'Chemistry': ['Materials Science', 'Nanotechnology'],
  'Engineering': ['Robotics', 'Renewable Energy', 'IoT'],
  'Psychology': ['Cognitive Science', 'Neuroscience'],
  'Economics': ['Financial Data', 'Data Science & AI'],
  'Sociology': ['Ethics in AI', 'Survey Data', 'Mixed Methods']
};

function getRandomInterests(dept) {
  const possible = interestMapping[dept] || ['Machine Learning', 'Data Science & AI', 'Ethics in AI', 'IoT'];
  // pick 1-3 random interests, bounded by possible.length
  const count = Math.min(Math.floor(Math.random() * 3) + 1, possible.length);
  const selected = new Set();
  while(selected.size < count) {
    selected.add(possible[Math.floor(Math.random() * possible.length)]);
  }
  return Array.from(selected);
}

async function seed() {
  let redisClient;
  try {
    console.log('Connecting to Redis...');
    redisClient = redis.createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379/0' });
    await redisClient.connect();

    console.log('Importing researchers from CSV...');
    const fileContent = fs.readFileSync(csvPath, 'utf8');
    const lines = fileContent.split('\n').filter(l => l.trim() !== '');
    
    let imported = 0;
    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      const parts = row.split(',').map(p => p.replace(/^"|"$/g, ''));
      
      if (parts.length >= 8) {
        const id = parts[0];
        const name = parts[1];
        const role = parts[2];
        const institution = parts[3];
        const country = parts[4];
        const works = parseInt(parts[5]) || 0;
        const citations = parseInt(parts[6]) || 0;
        const h_index = parseInt(parts[7]) || 0;
        
        const depts = Object.keys(interestMapping);
        const randomDept = depts[Math.floor(Math.random() * depts.length)];
        const interests = getRandomInterests(randomDept);

        try {
          await db.query(
            `INSERT INTO researcher_profiles 
             (id, name, role, institution, country, works_count, cited_by_count, h_index, research_interests) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (id) DO NOTHING`,
            [id, name, role, institution, country, works, citations, h_index, JSON.stringify(interests)]
          );

          // Emit to ML worker
          await redisClient.xAdd('profile.created', '*', {
            id: id.toString(),
            text: `Researcher ${name}, Role: ${role}, Institution: ${institution}. Interests: ${interests.join(', ')}`
          });
          imported++;
        } catch (dbErr) {
          console.error(`Error inserting row ${i}:`, dbErr.message);
        }
      }
      
      if (i % 100 === 0) console.log(`Processed ${i} researchers...`);
    }
    
    console.log(`Successfully imported and queued ${imported} researchers!`);
    await redisClient.quit();
    process.exit(0);
  } catch (err) {
    console.error('Error importing researchers:', err);
    if (redisClient) await redisClient.quit();
    process.exit(1);
  }
}

seed();
