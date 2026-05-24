require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'research_bridge',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

const blogs = [
  {
    title: "How to use ResearchBridge: The Complete Guide",
    excerpt: "Unlock the full potential of ResearchBridge. Learn how to discover papers, connect with global researchers, and maximize your academic impact.",
    content: "## Welcome to ResearchBridge\n\nResearchBridge is designed to break down academic silos and democratize research. Here is how you can use this platform effectively:\n\n### 1. The Discovery Engine\nIf you want to find a specific paper by DOI, use the **DOI Lookup** tool. It instantly pulls abstract data and Open Access PDFs using the OpenAlex API. If you want algorithmic recommendations based on your onboarding profile, visit **My Research Lab** to see Tailored Suggestions.\n\n### 2. The Living Room\nThe heart of the community. Join **Private Lab Groups** to discuss topics away from public view, or engage in the **Methodology Feed** to ask technical questions and share thoughts. Your reputation score goes up as others upvote your insights!\n\n### 3. The Library\nAccess thousands of journals categorised by their Q1/Q2 tier and SCImago Journal Rank (SJR). Keep your saved papers organized for later reading.\n\nStart your journey today by completing your profile and joining a group!",
    category: "Platform Guide",
    image_url: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=1000",
    status: 'approved'
  },
  {
    title: "The Future of Open Access: Bridging the Citation Gap",
    excerpt: "How democratized access to data is changing the landscape of scientific publishing in 2026.",
    content: "## The Open Access Revolution\n\nAs of 2026, the push for Open Access (OA) has never been stronger. Researchers are realizing that putting their work behind expensive paywalls drastically reduces citation velocity. By utilizing platforms like ResearchBridge, scholars can easily verify which journals offer Diamond OA, ensuring maximum visibility.\n\n### Why it matters\n1. Global Equity: Researchers in developing nations aren't locked out.\n2. Collaboration: Faster access means faster innovation.\n3. Public Trust: Taxpayers can finally read the science they fund.",
    category: "Research Policy",
    image_url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1000",
    status: 'approved'
  },
  {
    title: "Large Language Models in Methodological Validation",
    excerpt: "Exploring the role of AI in ensuring experimental reproducibility and data integrity.",
    content: "## AI in the Lab\n\nThe integration of LLMs into the peer review process has been controversial but incredibly effective. Models are now capable of reading complex methodology sections and flagging missing parameters (like temperature, exact reagents, or statistical bounds) before the paper even reaches human reviewers.\n\n### The Reproducibility Crisis\nFor years, the reproducibility crisis has plagued biology and psychology. AI tools acting as a 'methodology linter' are finally turning the tide. However, we must remain vigilant against AI hallucinations in data generation.",
    category: "Artificial Intelligence",
    image_url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1000",
    status: 'approved'
  },
  {
    title: "South Asian Ecology: A Collaborative Case Study",
    excerpt: "How a group of 50 researchers used ResearchBridge to map biodiversity in the Sundarbans.",
    content: "## Cross-Border Collaboration\n\nLast year, a group of researchers from Bangladesh, India, and the UK utilized the 'Private Lab Groups' feature on ResearchBridge to coordinate a massive ecological survey of the Sundarbans mangrove forest.\n\n### Methodological Sharing\nBy sharing their daily field protocols on the platform, teams operating hundreds of miles apart were able to standardize their soil salinity measurements. The resulting paper was published in Nature Ecology and cited over 100 times in its first week.",
    category: "Case Study",
    image_url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&q=80&w=1000",
    status: 'approved'
  },
  {
    title: "Navigating Grant Proposals as an Early Career Researcher",
    excerpt: "Tips and strategies for securing your first major funding block.",
    content: "## The Grant Maze\n\nWriting a grant proposal is an entirely different skill from writing a research paper. As an Early Career Researcher (ECR), you must learn to sell your vision.\n\n### Top Tips\n1. **Tell a Story:** Reviewers are humans. Make them care about the problem.\n2. **Pilot Data is King:** Never propose an entirely theoretical project without a shred of preliminary data.\n3. **Collaborate:** Use networks like ResearchBridge to find senior co-investigators who can lend credibility to your proposal.",
    category: "Career Advice",
    image_url: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=1000",
    status: 'approved'
  },
  {
    title: "The Ethics of Gene Editing in 2026",
    excerpt: "Where do we draw the line as CRISPR therapies enter mainstream clinics?",
    content: "## CRISPR in the Clinic\n\nWith the recent FDA approval of three new CRISPR-Cas9 therapies for systemic disorders, the ethical debate has shifted from 'if' to 'who'. \n\n### Access vs. Enhancement\nThe primary concern is no longer off-target mutations, which have been drastically reduced by base-editing techniques. The concern is economic. If a cure costs $2 million, we risk creating a genetic divide between the wealthy and the poor. It is imperative that global health organizations subsidize these groundbreaking treatments.",
    category: "Bioethics",
    image_url: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=80&w=1000",
    status: 'approved'
  },
  {
    title: "Why Mentorship Matters: Finding Your Academic Guardian",
    excerpt: "A good mentor can accelerate your career by a decade. Here is how to find one.",
    content: "## The Role of a Mentor\n\nA PhD supervisor is not necessarily a mentor. A mentor is someone who actively advocates for your career progression, introduces you to their network, and shields you from academic politics.\n\n### Finding the Right Fit\nDon't just look for the biggest name in your field. Look for researchers who have a track record of their students going on to successful independent careers. Use the ResearchBridge network to reach out respectfully—a well-crafted DM can change your life.",
    category: "Career Advice",
    image_url: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=1000",
    status: 'approved'
  }
];

async function seedBlogs() {
  try {
    console.log('Connecting to PostgreSQL...');
    
    // First ensure there is at least one admin user to assign as author
    const userRes = await pool.query("SELECT id FROM users WHERE role = 'super_admin' OR role = 'admin' LIMIT 1");
    let adminId;
    
    if (userRes.rows.length === 0) {
      console.log('No admin found. Fetching any user...');
      const fallbackRes = await pool.query("SELECT id FROM users LIMIT 1");
      if (fallbackRes.rows.length > 0) {
        adminId = fallbackRes.rows[0].id;
      } else {
        console.log('No users in database! Please seed users first.');
        process.exit(1);
      }
    } else {
      adminId = userRes.rows[0].id;
    }

    // Clear existing blogs
    await pool.query('TRUNCATE TABLE blogs RESTART IDENTITY CASCADE');

    for (const blog of blogs) {
      await pool.query(
        `INSERT INTO blogs (title, excerpt, content, author_id, category, image_url, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [blog.title, blog.excerpt, blog.content, adminId, blog.category, blog.image_url, blog.status]
      );
    }

    console.log(`Successfully seeded ${blogs.length} blogs!`);
  } catch (error) {
    console.error('Error seeding blogs:', error);
  } finally {
    pool.end();
  }
}

seedBlogs();
