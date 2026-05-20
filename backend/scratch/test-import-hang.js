const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
const redis = require('redis');

const csvPath = path.join(__dirname, '../../assets/researchers.csv');

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
  const count = Math.floor(Math.random() * 3) + 1;
  const selected = new Set();
  while(selected.size < count) {
    selected.add(possible[Math.floor(Math.random() * possible.length)]);
  }
  return Array.from(selected);
}

async function test() {
  let redisClient;
  try {
    console.log('Connecting to Redis...');
    redisClient = redis.createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379/0' });
    await redisClient.connect();
    console.log('Connected to Redis successfully.');

    console.log('Reading CSV...');
    const fileContent = fs.readFileSync(csvPath, 'utf8');
    const lines = fileContent.split('\n').filter(l => l.trim() !== '');
    console.log(`Found ${lines.length} lines in CSV.`);

    let imported = 0;
    const limit = Math.min(lines.length, 20);
    for (let i = 1; i < limit; i++) {
      console.log(`--- Processing row i=${i} ---`);
      const row = lines[i];
      const parts = row.split(',').map(p => p.replace(/^"|"$/g, ''));
      console.log(`Row parts parsed: name=${parts[1]}`);
      
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
          console.log(`Row i=${i}: DB query starting...`);
          await db.query(
            `INSERT INTO researcher_profiles 
             (id, name, role, institution, country, works_count, cited_by_count, h_index, research_interests) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
            [id, name, role, institution, country, works, citations, h_index, JSON.stringify(interests)]
          );
          console.log(`Row i=${i}: DB query succeeded`);

          console.log(`Row i=${i}: Redis xAdd starting...`);
          await redisClient.xAdd('profile.created', '*', {
            id: id.toString(),
            text: `Researcher ${name}, Role: ${role}, Institution: ${institution}. Interests: ${interests.join(', ')}`
          });
          console.log(`Row i=${i}: Redis xAdd succeeded`);
          imported++;
        } catch (err) {
          console.error(`Row ${i} failed:`, err.message);
        }
      } else {
        console.log(`Row i=${i} parts length is too short: ${parts.length}`);
      }
    }
    console.log(`Finished importing ${imported} rows.`);
  } catch (err) {
    console.error('Test failed with error:', err);
  } finally {
    if (redisClient) {
      console.log('Closing Redis...');
      await redisClient.quit();
    }
    console.log('Exiting...');
    process.exit(0);
  }
}

test();
