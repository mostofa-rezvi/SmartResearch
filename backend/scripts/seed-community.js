/**
 * seed-community.js
 * ---------------------------------------------------------------
 * Populates the community Q&A with 50+ real research questions.
 * ---------------------------------------------------------------
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const SEED_QUESTIONS = [
  // Academic & Publishing
  { title: "How do I choose between Q1 and Q2 journals for my first paper?", content: "I have a solid empirical study but I'm unsure if I should risk rejection at a Q1 or play it safe with Q2. What's the best strategy for an early-career researcher?", tags: '["publishing", "strategy", "q1-journals"]' },
  { title: "What is the typical timeline from submission to publication in computer science?", content: "Is it normal to wait 6+ months just for the first round of peer review?", tags: '["publishing", "computer-science", "timeline"]' },
  { title: "Should I pay for Open Access if my university doesn't cover it?", content: "The APC is around $3000. Is the citation bump worth paying out of pocket?", tags: '["open-access", "funding", "publishing"]' },
  { title: "How to handle a peer reviewer who completely misunderstood my methodology?", content: "Reviewer 2 rejected my paper based on a fundamental misunderstanding of the statistical model I used. How do I politely address this in the rebuttal?", tags: '["peer-review", "methodology", "rebuttal"]' },
  
  // Research Methodology & Tools
  { title: "Best statistical tools for survey research in 2026?", content: "I'm moving away from SPSS. Is R or Python better for complex survey data with multiple Likert scales?", tags: '["statistics", "tools", "data-analysis"]' },
  { title: "How do you manage an ever-growing literature review?", content: "I have over 300 papers saved. Mendeley is getting slow. What's the modern workflow for literature mapping?", tags: '["literature-review", "tools", "workflow"]' },
  { title: "Qualitative vs Quantitative approach for social behavior analysis?", content: "Looking for insights on mixed-method approaches when studying online communities.", tags: '["methodology", "mixed-methods", "social-science"]' },
  
  // Career & Collaboration
  { title: "How to find a PhD supervisor abroad?", content: "I want to apply to universities in Europe. Should I cold-email professors or only apply to listed vacancies?", tags: '["phd", "networking", "career"]' },
  { title: "Dealing with ghost authorship requests", content: "A senior professor who didn't contribute to my project wants to be listed as the last author. Is this standard practice?", tags: '["ethics", "authorship", "academia"]' },
  { title: "How much time should a postdoc spend on grant writing vs actual research?", content: "I feel like 80% of my time is going into grant proposals instead of the lab. Is this normal?", tags: '["postdoc", "funding", "career"]' },
  
  // Discipline Specific (AI/ML/Bio)
  { title: "Handling class imbalance in deep learning for medical imaging", content: "I have 10,000 healthy scans but only 500 anomalous ones. SMOTE isn't working well for CNNs. Any advice?", tags: '["machine-learning", "medical-imaging", "data-science"]' },
  { title: "Reproducibility crisis in CRISPR off-target analysis", content: "Has anyone else struggled to reproduce the off-target rates published in recent high-impact journals?", tags: '["crispr", "biology", "reproducibility"]' },
  
  // Add more variations to hit ~50 target via generation
];

// Generate more seed data programmatically to hit 50+
const topics = ["Machine Learning", "Climate Science", "Economics", "Psychology", "Materials Science"];
const intents = ["How to start with", "What are the latest trends in", "Help understanding", "Looking for collaborators in"];

for (let i = 0; i < 40; i++) {
  const topic = topics[Math.floor(Math.random() * topics.length)];
  const intent = intents[Math.floor(Math.random() * intents.length)];
  SEED_QUESTIONS.push({
    title: `${intent} ${topic}?`,
    content: `I am currently exploring ${topic} and looking for guidance, resources, or potential collaborators. Any advice is welcome!`,
    tags: `["${topic.toLowerCase().replace(' ', '-')}", "general"]`
  });
}

async function main() {
  console.log("💬 Seeding Community Q&A...");
  const client = await pool.connect();
  
  try {
    // 1. Ensure a dummy user exists to author the posts
    let userRes = await client.query(`SELECT id FROM users WHERE email = 'seed@researchbridge.app'`);
    if (userRes.rows.length === 0) {
      userRes = await client.query(
        `INSERT INTO users (name, email, password, is_verified) VALUES ('System Author', 'seed@researchbridge.app', 'dummy', true) RETURNING id`
      );
    }
    const authorId = userRes.rows[0].id;

    let total = 0;
    for (const q of SEED_QUESTIONS) {
      await client.query(
        `INSERT INTO community_posts (user_id, type, title, content, tags)
         VALUES ($1, 'question', $2, $3, $4::jsonb)`,
        [authorId, q.title, q.content, q.tags]
      );
      total++;
    }
    console.log(`\n🎉 Total community questions seeded: ${total}`);
  } catch (err) {
    console.error("❌ Seed failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
