const db = require('../src/config/db');

const questions = [
  // SECTION: Identity
  { section: 'identity', type: 'single_choice', q: 'What is your current primary academic or professional role?', options: ['Undergraduate Student', 'Master Student', 'PhD Candidate', 'Postdoc', 'Assistant Professor', 'Associate Professor', 'Professor', 'Industry Researcher', 'Independent Researcher'] },
  { section: 'identity', type: 'single_choice', q: 'How many years of research experience do you have?', options: ['Less than 1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years'] },
  { section: 'identity', type: 'multi_choice', q: 'Which disciplines best describe your background?', options: ['Computer Science', 'Data Science & AI', 'Physics', 'Biology', 'Chemistry', 'Mathematics', 'Engineering', 'Psychology', 'Sociology', 'Medicine', 'Economics', 'Humanities'] },
  { section: 'identity', type: 'free_text', q: 'Briefly describe your overall research mission or long-term vision.', options: [] },

  // SECTION: Focus
  { section: 'focus', type: 'multi_choice', q: 'What are your core research interests?', options: ['Machine Learning', 'Artificial Intelligence', 'Quantum Computing', 'Genetics', 'Robotics', 'Neuroscience', 'Nanotechnology', 'Cybersecurity', 'Climate Science', 'Bioinformatics', 'Astrophysics', 'Materials Science', 'Renewable Energy', 'Public Health', 'Cognitive Science', 'Ethics in AI', 'Blockchain', 'IoT'] },
  { section: 'focus', type: 'single_choice', q: 'What best describes your primary research methodology?', options: ['Theoretical / Mathematical', 'Empirical / Experimental', 'Computational / Simulation', 'Qualitative', 'Mixed Methods'] },
  { section: 'focus', type: 'multi_choice', q: 'Which tools or programming languages do you use most frequently?', options: ['Python', 'R', 'MATLAB', 'C/C++', 'Java', 'JavaScript/TypeScript', 'SQL', 'TensorFlow/PyTorch', 'SPSS/Stata', 'Excel', 'None of the above'] },
  { section: 'focus', type: 'single_choice', q: 'Are you currently working on a specific research project?', options: ['Yes, actively', 'Yes, but in early stages', 'No, looking for ideas', 'No, taking a break'] },
  { section: 'focus', type: 'free_text', q: 'What is the biggest technical or conceptual challenge in your current work?', options: [] },
  { section: 'focus', type: 'multi_choice', q: 'What type of data do you work with most?', options: ['Text / NLP', 'Images / Video', 'Time Series', 'Genomic Data', 'Survey Data', 'Sensor / IoT Data', 'Financial Data', 'I do not work with data directly'] },

  // SECTION: Collaboration
  { section: 'collaboration', type: 'single_choice', q: 'How do you prefer to collaborate?', options: ['As a project lead', 'As a contributor/specialist', 'Equal partnership', 'Mentoring juniors', 'Being mentored'] },
  { section: 'collaboration', type: 'multi_choice', q: 'What skills are you looking for in a collaborator?', options: ['Data Analysis', 'Programming/Coding', 'Writing & Editing', 'Experimental Design', 'Domain Expertise', 'Statistical Modeling', 'Project Management', 'Funding & Grants'] },
  { section: 'collaboration', type: 'single_choice', q: 'Are you open to cross-disciplinary collaborations?', options: ['Very open', 'Somewhat open', 'Only within my field'] },
  { section: 'collaboration', type: 'single_choice', q: 'How much time can you commit to a new collaborative project?', options: ['Less than 2 hours/week', '2-5 hours/week', '5-10 hours/week', '10+ hours/week'] },
  { section: 'collaboration', type: 'free_text', q: 'Describe your ideal collaborator or team dynamic.', options: [] },

  // SECTION: Publication
  { section: 'publication', type: 'single_choice', q: 'What is your primary goal for the next 12 months?', options: ['Publish a paper in a top-tier journal', 'Present at a major conference', 'Submit a grant proposal', 'Complete a thesis/dissertation', 'Build a prototype or software tool', 'Learn new research skills'] },
  { section: 'publication', type: 'multi_choice', q: 'Which types of publications do you target?', options: ['Peer-reviewed Journals', 'Conference Proceedings', 'Preprints (e.g., arXiv)', 'Book Chapters', 'Whitepapers / Industry Reports'] },
  { section: 'publication', type: 'single_choice', q: 'How do you feel about open-access publishing?', options: ['Strongly prefer open access', 'Neutral', 'Prefer traditional journals', 'Not sure'] },

  // SECTION: Community
  { section: 'community', type: 'single_choice', q: 'What do you want to get out of this community?', options: ['Networking', 'Finding co-authors', 'Getting feedback on work', 'Mentorship', 'General discussion'] },
  { section: 'community', type: 'multi_choice', q: 'Are you interested in participating in peer review or giving feedback?', options: ['Yes, happy to review papers', 'Yes, informal feedback', 'Not at the moment'] },
  { section: 'community', type: 'free_text', q: 'Is there anything else you want the community to know about you?', options: [] }
];

async function seed() {
  try {
    console.log('Seeding 21 onboarding questions...');
    await db.query('DELETE FROM onboarding_answers'); // clear FK deps
    await db.query('DELETE FROM onboarding_questions');
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await db.query(
        `INSERT INTO onboarding_questions (section, question_text, input_type, options, sort_order) 
         VALUES ($1, $2, $3, $4, $5)`,
        [q.section, q.q, q.type, JSON.stringify(q.options), i + 1]
      );
    }
    console.log('Successfully seeded 21 onboarding questions!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding onboarding:', err);
    process.exit(1);
  }
}

seed();
