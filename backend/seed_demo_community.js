/*
 * Demo seeder — realistic groups + community for a live demo.
 * Structural data (users, groups, memberships) via SQL; content + interactions
 * (posts, comments, votes, reactions, accepted answers) via the REAL backend API
 * so ES indexing / reputation / vote scores are genuine.
 *
 * Safe by design:
 *  - seed researchers use reserved *.test emails (never deliverable) so the live
 *    SMTP account can't email real people;
 *  - nobody but the owner comments on the owner's posts (avoids emailing the real gmail).
 *
 * Run once:  node seed_demo_community.js
 * Undo:      node seed_demo_community.js --purge
 */
require('dotenv').config();
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const API = process.env.SEED_API_BASE || 'http://127.0.0.1:5000/api/v1';
const SECRET = process.env.JWT_ACCESS_SECRET;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const tok = (id) => jwt.sign({ id }, SECRET, { expiresIn: '2h' });
const H = (id) => ({ headers: { Authorization: `Bearer ${tok(id)}`, 'Content-Type': 'application/json' } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const OWNER_EMAIL = 'mostofa.aminur.rezvi@gmail.com';

// ---- realistic researchers (emails are reserved .test => undeliverable) ----
const RESEARCHERS = [
  { key: 'aisha',  name: 'Dr. Aisha Rahman',   email: 'aisha.rahman@demo.researchbridge.test',  institution: 'BUET, Dhaka',                 tier: 'professor', rank: 0.82, rep: 540, interests: ['NLP', 'Low-Resource Languages', 'Machine Translation'] },
  { key: 'chen',   name: 'Dr. Chen Wei',        email: 'chen.wei@demo.researchbridge.test',       institution: 'Nanyang Technological University', tier: 'professor', rank: 0.78, rep: 610, interests: ['Graph Neural Networks', 'Deep Learning'] },
  { key: 'sofia',  name: 'Dr. Sofia Almeida',   email: 'sofia.almeida@demo.researchbridge.test',  institution: 'University of Lisbon',        tier: 'verified',  rank: 0.44, rep: 230, interests: ['Bioinformatics', 'Genomics'] },
  { key: 'marcus', name: 'Dr. Marcus Feld',     email: 'marcus.feld@demo.researchbridge.test',    institution: 'ETH Zurich',                  tier: 'professor', rank: 0.71, rep: 480, interests: ['Climate Modeling', 'Remote Sensing'] },
  { key: 'priya',  name: 'Priya Nair',          email: 'priya.nair@demo.researchbridge.test',     institution: 'IIT Bombay',                  tier: 'verified',  rank: 0.38, rep: 175, interests: ['HCI', 'Accessibility'] },
  { key: 'omar',   name: 'Dr. Omar Haddad',     email: 'omar.haddad@demo.researchbridge.test',    institution: 'KAUST',                       tier: 'professor', rank: 0.69, rep: 455, interests: ['Quantum Computing', 'Optimization'] },
  { key: 'lucas',  name: 'Lucas Moreau',        email: 'lucas.moreau@demo.researchbridge.test',   institution: 'Sorbonne Université',         tier: 'basic',     rank: 0.12, rep: 60,  interests: ['Epidemiology', 'Public Health'] },
  { key: 'elena',  name: 'Dr. Elena Petrova',   email: 'elena.petrova@demo.researchbridge.test',  institution: 'Max Planck Institute',        tier: 'professor', rank: 0.74, rep: 520, interests: ['Reinforcement Learning', 'Robotics'] },
];

const GROUPS = [
  { key: 'nlp',     name: 'Bengali & Low-Resource NLP',        focus: 'Natural Language Processing', admin: 'aisha',  members: ['chen', 'priya', 'lucas', 'OWNER'], daysAgo: 26 },
  { key: 'gnn',     name: 'Graph Neural Networks Reading Group', focus: 'Machine Learning',          admin: 'chen',   members: ['elena', 'aisha', 'OWNER'],         daysAgo: 22 },
  { key: 'genomics',name: 'Genomics & Computational Biology',  focus: 'Bioinformatics',              admin: 'sofia',  members: ['lucas', 'marcus'],                 daysAgo: 19 },
  { key: 'climate', name: 'Climate & Earth Observation',       focus: 'Remote Sensing',              admin: 'marcus', members: ['sofia', 'elena', 'OWNER'],         daysAgo: 15 },
  { key: 'hci',     name: 'Human-Centered AI & Accessibility', focus: 'Human-Computer Interaction',  admin: 'priya',  members: ['aisha', 'chen'],                   daysAgo: 12 },
  { key: 'quantum', name: 'Quantum Algorithms',                focus: 'Quantum Computing',           admin: 'omar',   members: ['elena', 'chen'],                   daysAgo: 9 },
];

// ---- posts: authored across researchers; owner authors a couple too ----
// comment authors never target OWNER's posts (email safety); OWNER may comment anywhere.
const POSTS = [
  { key:'p1', author:'aisha', group:'nlp', type:'Question', daysAgo:24,
    title:'Best tokenization strategy for Bengali given limited labelled data?',
    content:'We are building a NER model for Bengali clinical notes but only have ~4k labelled sentences. Is subword (BPE/SentencePiece) still worth it at this scale, or does a morpheme-aware tokenizer generalise better for agglutinative scripts? Curious what has worked for others on low-resource Indic languages.',
    tags:['NLP','Bengali','Tokenization','Low-Resource'],
    up:['chen','priya','lucas','elena','OWNER'], react:[['chen','insightful'],['priya','curious'],['OWNER','support']],
    comments:[
      { author:'chen', daysAgo:24, text:'At 4k sentences I would start with SentencePiece unigram (vocab ~8k) and heavily rely on multilingual pretraining (IndicBERT / MuRIL). The morpheme-aware gains tend to disappear once you fine-tune a subword LM.',
        replies:[ { author:'aisha', daysAgo:23, text:'That matches our early results — MuRIL + unigram beat our custom morph tokenizer by ~3 F1. Thanks!' } ] },
      { author:'lucas', daysAgo:23, text:'Also worth trying data augmentation via back-translation through Hindi — gave us a decent bump on a similar-size corpus.' },
      { author:'priya', daysAgo:22, text:'+1 to MuRIL. Watch out for script normalisation (nukta/zero-width joiners) before tokenizing, it silently fragments your vocab.' },
    ], accept:2 /* index into comments -> priya's answer */ },

  { key:'p2', author:'chen', group:'gnn', type:'Thought', daysAgo:20,
    title:'Over-smoothing is still the elephant in the GNN room',
    content:'Every few months a new normalisation trick claims to "solve" over-smoothing, yet on heterophilic graphs most deep GNNs still collapse past 4-5 layers. I increasingly think the answer is architectural (decoupling propagation from transformation) rather than another normalisation layer. Change my mind.',
    tags:['Graph Neural Networks','Over-smoothing','Deep Learning'],
    up:['elena','aisha','omar','OWNER'], react:[['elena','insightful'],['omar','celebrate']],
    comments:[
      { author:'elena', daysAgo:20, text:'Decoupling (à la APPNP/GPR-GNN) is the right instinct. Propagation is a low-pass filter; you want a learnable filter response, not just fewer/more layers.' },
      { author:'aisha', daysAgo:19, text:'Heterophily benchmarks are also a bit adversarial though — on real citation graphs 2-3 layers is usually enough and over-smoothing is moot.' },
    ] },

  { key:'p3', author:'sofia', group:'genomics', type:'Question', daysAgo:17,
    title:'Batch-effect correction: Harmony vs scVI for 10x scRNA-seq?',
    content:'Integrating 6 single-cell RNA-seq batches from different chemistries. Harmony is fast and preserves global structure but I worry it over-corrects rare cell types. scVI is principled but slow to train. For a downstream trajectory-inference task, which would you trust more?',
    tags:['Bioinformatics','scRNA-seq','Batch Correction'],
    up:['lucas','marcus','OWNER'], react:[['marcus','curious']],
    comments:[
      { author:'lucas', daysAgo:16, text:'For trajectory work I would lean scVI — the latent space is smoother and you can condition out batch explicitly. Harmony can kink pseudotime around rare populations.' },
    ], accept:0 },

  { key:'p4', author:'marcus', group:'climate', type:'Thought', daysAgo:14,
    title:'Foundation models for Earth observation are overfitting to Sentinel-2',
    content:'Most "geospatial foundation models" are pretrained almost entirely on Sentinel-2 RGB+NIR. When you move to SAR or hyperspectral they fall apart. We need multi-sensor pretraining objectives, not just bigger ViTs on the same optical bands.',
    tags:['Remote Sensing','Foundation Models','Earth Observation'],
    up:['sofia','elena','chen','OWNER'], react:[['elena','support'],['chen','insightful']],
    comments:[
      { author:'elena', daysAgo:13, text:'Agreed. Cross-modal masked autoencoding (optical<->SAR) is promising but the paired data is scarce. Curious if anyone has tried contrastive alignment on co-registered tiles.' },
      { author:'sofia', daysAgo:13, text:'Even within optical, atmospheric correction differences between products wreck transfer. Domain gap is under-reported in these papers.' },
    ] },

  { key:'p5', author:'priya', group:'hci', type:'Question', daysAgo:11,
    title:'How do you evaluate accessibility of AI-generated UI without large user studies?',
    content:'We generate UI layouts with an LLM and want to catch accessibility regressions (contrast, focus order, screen-reader labels) automatically. Automated axe-core checks catch the obvious stuff but miss semantic issues. Is there a lightweight proxy metric that correlates with real assistive-tech user outcomes?',
    tags:['HCI','Accessibility','LLM','Evaluation'],
    up:['aisha','chen','OWNER'], react:[['aisha','curious']],
    comments:[
      { author:'chen', daysAgo:10, text:'We paired axe-core with a small heuristic model trained on WCAG violation reports — not perfect but flags ~70% of the semantic issues a manual audit finds. Happy to share the label schema.' },
      { author:'aisha', daysAgo:10, text:'Recruiting even 3-4 assistive-tech users for a formative pass tends to beat any proxy metric we tried. Small-n qualitative goes a long way here.' },
    ], accept:1 },

  { key:'p6', author:'omar', group:'quantum', type:'Thought', daysAgo:8,
    title:'NISQ variational algorithms: are we optimising noise?',
    content:'Barren plateaus plus hardware noise mean a lot of VQE/QAOA results are, charitably, fitting the device rather than the problem. I would love to see more ablations where the same ansatz is run on a noiseless simulator to show the *quantum* contribution is real.',
    tags:['Quantum Computing','VQE','QAOA','NISQ'],
    up:['elena','chen','OWNER'], react:[['chen','insightful']],
    comments:[
      { author:'elena', daysAgo:7, text:'This. A depolarising-noise simulator baseline should be table stakes for any NISQ advantage claim.' },
    ] },

  { key:'p7', author:'elena', group:'gnn', type:'Question', daysAgo:6,
    title:'Reward shaping vs learned intrinsic reward for sparse-reward manipulation?',
    content:'For a robotic pick-and-place with very sparse extrinsic reward, hand-designed shaping is brittle and leaks bias. Learned intrinsic rewards (RND, ICM) help exploration but sometimes chase novelty forever. What is the current best practice for the sim-to-real setting?',
    tags:['Reinforcement Learning','Robotics','Reward Shaping'],
    up:['chen','omar','OWNER'], react:[['omar','curious']],
    comments:[
      { author:'omar', daysAgo:5, text:'Curriculum + goal relabelling (HER) got us further than any intrinsic reward for manipulation. Save RND for genuinely exploratory tasks.' },
    ], accept:0 },

  { key:'p8', author:'lucas', group:'genomics', type:'Question', daysAgo:5,
    title:'Nowcasting outbreaks: how much do wastewater signals actually add?',
    content:'We are fusing clinical case counts with wastewater viral load to nowcast respiratory outbreaks. Wastewater leads by ~4-6 days in theory but is noisy and site-dependent. Has anyone quantified the real forecasting skill improvement once you account for reporting delays?',
    tags:['Epidemiology','Nowcasting','Public Health'],
    up:['sofia','marcus','OWNER'], react:[['sofia','support']],
    comments:[
      { author:'sofia', daysAgo:4, text:'In our county-level model wastewater added ~1.5 days of usable lead time after delay-correction — real but smaller than the raw signal suggests. Normalise by flow and PMMoV.' },
    ] },

  // ---- global (no group) posts ----
  { key:'p9', author:'aisha', group:null, type:'Thought', daysAgo:4,
    title:'Peer review is drowning — should we normalise reviewer credit?',
    content:'A verifiable, portable record of review contributions (like ORCID for reviews) might finally make quality reviewing worth people\'s time. SmartResearch\'s TrustRank is a nice step in that direction. What would it take for hiring committees to actually value it?',
    tags:['Peer Review','Academia','Reputation'],
    up:['chen','sofia','priya','marcus','elena','OWNER'], react:[['priya','celebrate'],['marcus','support'],['OWNER','insightful']],
    comments:[
      { author:'marcus', daysAgo:3, text:'The chicken-and-egg problem is recognition. Once one major funder asks for a review record on the CV, adoption follows fast.' },
      { author:'chen', daysAgo:3, text:'Portability + tamper-evidence is the key technical piece. A hash-chained log that any institution can verify independently.' },
    ] },

  { key:'p10', author:'chen', group:null, type:'Question', daysAgo:3,
    title:'Reproducibility: do you pin CUDA/cuDNN in your paper artifacts?',
    content:'Reviewers rarely rerun code, but when they do, mismatched CUDA/cuDNN versions silently change results by a few tenths of a point. Do you ship a full Docker image with pinned drivers, or just a requirements.txt and hope? Where do you draw the line for "reproducible enough"?',
    tags:['Reproducibility','MLOps','Research'],
    up:['elena','omar','aisha','OWNER'], react:[['elena','insightful']],
    comments:[
      { author:'omar', daysAgo:2, text:'Full Docker image + a frozen seed + reported hardware. Anything less and someone opens an issue within a week.' },
      { author:'elena', daysAgo:2, text:'We also log a checksum of the environment; if it drifts, CI refuses to publish the results table.' },
    ] },

  // ---- owner-authored posts (others do NOT comment => no real email) ----
  { key:'p11', author:'OWNER', group:'nlp', type:'Thought', daysAgo:7,
    title:'Excited to kick off the Bengali & Low-Resource NLP group here',
    content:'Starting this space to trade notes on Bengali and other low-resource Indic NLP — datasets, tokenization, evaluation, and getting models into production for real users. Introduce yourself and drop what you are working on!',
    tags:['NLP','Community','Low-Resource'],
    up:['aisha','chen','priya','lucas'], react:[['aisha','celebrate'],['priya','support']],
    comments:[] },

  { key:'p12', author:'OWNER', group:null, type:'Question', daysAgo:2,
    title:'What is the cleanest way to benchmark semantic search relevance without human labels?',
    content:'Standing up a hybrid (BM25 + dense kNN) search and I want a relevance signal before I can afford annotation. Are pseudo-labels from click models or LLM-as-a-judge reliable enough to guide ranking-fusion weights early on?',
    tags:['Information Retrieval','Semantic Search','Evaluation'],
    up:['chen','elena','sofia'], react:[['chen','curious']],
    comments:[] },
];

async function upsertUser(r) {
  const q = `INSERT INTO users (name, email, role, institution, trust_tier, trust_rank, reputation_points, is_institutional, institution_verified, research_interests, onboarding_completed)
             VALUES ($1,$2,'user',$3,$4,$5,$6,true,$7,$8,true)
             ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name, institution=EXCLUDED.institution,
               trust_tier=EXCLUDED.trust_tier, trust_rank=EXCLUDED.trust_rank, reputation_points=EXCLUDED.reputation_points
             RETURNING id`;
  const verified = r.tier === 'professor' || r.tier === 'verified';
  const ri = JSON.stringify({ interests: r.interests });
  const { rows } = await pool.query(q, [r.name, r.email, r.institution, r.tier, r.rank, r.rep, verified, ri]);
  return rows[0].id;
}

async function getOwnerId() {
  const { rows } = await pool.query('SELECT id FROM users WHERE email=$1', [OWNER_EMAIL]);
  if (!rows.length) throw new Error('Owner account not found: ' + OWNER_EMAIL);
  return rows[0].id;
}

async function purge() {
  const emails = RESEARCHERS.map((r) => r.email);
  const { rows } = await pool.query('SELECT id FROM users WHERE email = ANY($1)', [emails]);
  const ids = rows.map((r) => r.id);
  const groupNames = GROUPS.map((g) => g.name);
  // delete groups we created (cascades posts/members), then seed users (cascades their posts/comments/votes)
  await pool.query('DELETE FROM groups WHERE name = ANY($1)', [groupNames]);
  if (ids.length) await pool.query('DELETE FROM users WHERE id = ANY($1)', [ids]);
  console.log(`Purged ${ids.length} seed researchers and ${groupNames.length} groups (cascaded posts/comments/votes).`);
}

async function main() {
  if (process.argv.includes('--purge')) { await purge(); await pool.end(); return; }
  if (!SECRET) throw new Error('JWT_ACCESS_SECRET not loaded from .env');

  const id = {}; // key -> userId
  for (const r of RESEARCHERS) { id[r.key] = await upsertUser(r); }
  id.OWNER = await getOwnerId();
  console.log('Researchers ready:', Object.fromEntries(Object.entries(id)));

  // ---- groups + memberships (SQL: full control over creator/roles/created_at) ----
  const gid = {};
  for (const g of GROUPS) {
    const created = `now() - interval '${g.daysAgo} days'`;
    const existing = await pool.query('SELECT id FROM groups WHERE name=$1', [g.name]);
    let groupId;
    if (existing.rows.length) {
      groupId = existing.rows[0].id;
    } else {
      const ins = await pool.query(
        `INSERT INTO groups (name, description, focus_area, type, creator_id, created_at)
         VALUES ($1,$2,$3,'public',$4, ${created}) RETURNING id`,
        [g.name, `A community for researchers working on ${g.focus.toLowerCase()}. Share papers, questions, and collaborations.`, g.focus, id[g.admin]]
      );
      groupId = ins.rows[0].id;
    }
    gid[g.key] = groupId;
    // admin membership
    await pool.query(
      `INSERT INTO group_members (group_id, user_id, role, status, joined_at) VALUES ($1,$2,'admin','approved', ${created})
       ON CONFLICT (group_id, user_id) DO UPDATE SET role='admin', status='approved'`,
      [groupId, id[g.admin]]
    );
    // members
    for (const m of g.members) {
      await pool.query(
        `INSERT INTO group_members (group_id, user_id, role, status, joined_at)
         VALUES ($1,$2,'member','approved', now() - interval '${Math.max(1, g.daysAgo - 3)} days')
         ON CONFLICT (group_id, user_id) DO UPDATE SET status='approved'`,
        [groupId, id[m]]
      );
    }
    console.log(`Group #${groupId}: ${g.name} (admin ${g.admin}, ${g.members.length} members)`);
  }

  // ---- posts + interactions via the REAL API ----
  const postId = {};
  for (const p of POSTS) {
    const body = { type: p.type, title: p.title, content: p.content, tags: p.tags };
    if (p.group) body.group_id = gid[p.group];
    const res = await axios.post(`${API}/community/posts`, body, H(id[p.author]));
    const pid = res.data.data.id;
    postId[p.key] = pid;
    await pool.query('UPDATE community_posts SET created_at = now() - ($1)::interval WHERE id=$2', [`${p.daysAgo} days`, pid]);

    // upvotes from distinct users
    for (const u of (p.up || [])) {
      try { await axios.post(`${API}/community/posts/${pid}/vote`, { value: 1 }, H(id[u])); } catch (e) { /* rep side-effect may warn */ }
    }
    // reactions
    for (const [u, t] of (p.react || [])) {
      try { await axios.post(`${API}/community/posts/${pid}/react`, { reaction_type: t }, H(id[u])); } catch (e) {}
    }
    // comments (+ threaded replies); backdate each
    const commentIds = [];
    for (const c of (p.comments || [])) {
      const cr = await axios.post(`${API}/community/posts/${pid}/comments`, { content: c.text }, H(id[c.author]));
      const cid = cr.data.data.id;
      commentIds.push(cid);
      await pool.query('UPDATE comments SET created_at = now() - ($1)::interval WHERE id=$2', [`${c.daysAgo} days`, cid]);
      for (const rep of (c.replies || [])) {
        const rr = await axios.post(`${API}/community/posts/${pid}/comments`, { content: rep.text, parent_id: cid }, H(id[rep.author]));
        await pool.query('UPDATE comments SET created_at = now() - ($1)::interval WHERE id=$2', [`${rep.daysAgo} days`, rr.data.data.id]);
      }
    }
    // accepted answer (post author accepts one comment)
    if (typeof p.accept === 'number' && commentIds[p.accept]) {
      try { await axios.post(`${API}/community/posts/${pid}/accept-answer`, { comment_id: commentIds[p.accept] }, H(id[p.author])); } catch (e) {}
    }
    console.log(`Post #${pid} [${p.type}] by ${p.author}${p.group ? ' in ' + p.group : ''}: "${p.title.slice(0, 48)}..."`);
    await sleep(40);
  }

  // spread post view counts a little for realism
  for (const key of Object.keys(postId)) {
    await pool.query('UPDATE community_posts SET view_count = $1 WHERE id=$2', [40 + Math.floor(200 * Math.abs(Math.sin(postId[key]))), postId[key]]);
  }

  console.log(`\nDone: ${RESEARCHERS.length} researchers, ${GROUPS.length} groups, ${POSTS.length} posts + comments/votes/reactions/accepted-answers.`);
  await pool.end();
}

main().catch(async (e) => { console.error('SEED FAILED:', e.response?.data || e.message); await pool.end(); process.exit(1); });
