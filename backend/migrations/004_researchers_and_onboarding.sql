-- Migration 004: Researchers & Onboarding Questions
-- Researcher profiles sourced from OpenAlex API

CREATE TABLE IF NOT EXISTS researchers (
    id SERIAL PRIMARY KEY,
    openalex_id VARCHAR(100) UNIQUE,
    orcid VARCHAR(50),
    name VARCHAR(500) NOT NULL,
    institution VARCHAR(500),
    country_code VARCHAR(10),
    research_domains JSONB DEFAULT '[]',      -- Array of topic strings
    citation_count INTEGER DEFAULT 0,
    works_count INTEGER DEFAULT 0,
    h_index INTEGER,
    profile_url VARCHAR(500),                 -- OpenAlex profile URL
    orcid_url VARCHAR(500),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_researchers_citation ON researchers(citation_count DESC);
CREATE INDEX IF NOT EXISTS idx_researchers_country ON researchers(country_code);

-- Onboarding questions for new users (drives recommendation engine)
CREATE TABLE IF NOT EXISTS onboarding_questions (
    id SERIAL PRIMARY KEY,
    section VARCHAR(50) NOT NULL,            -- 'identity', 'focus', 'collaboration', 'publication', 'community'
    question_text TEXT NOT NULL,
    input_type VARCHAR(30) NOT NULL,         -- 'single_choice', 'multi_choice', 'free_text', 'scale'
    options JSONB DEFAULT '[]',              -- Array of option strings for choice questions
    is_required BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed the 21 onboarding questions from plan.txt
INSERT INTO onboarding_questions (section, question_text, input_type, options, is_required, sort_order) VALUES
-- Section A: Identity
('identity', 'What is your current role?', 'single_choice', '["Student","PhD Researcher","Professor","Industry Researcher","Independent"]', TRUE, 1),
('identity', 'What is your highest degree?', 'single_choice', '["Bachelor''s","Master''s","PhD","Postdoc"]', TRUE, 2),
('identity', 'Which country/institution are you affiliated with?', 'free_text', '[]', TRUE, 3),
('identity', 'How many years of research experience do you have?', 'single_choice', '["0–1","2–5","5–10","10+"]', TRUE, 4),

-- Section B: Research Focus
('focus', 'What is your primary research domain?', 'multi_choice', '["Computer Science / AI / ML","Biomedical / Life Sciences","Environmental Science / Climate","Physics / Materials Science","Economics / Social Sciences","Engineering (Civil, Mechanical, Electrical)","Psychology / Neuroscience","Mathematics / Statistics","Chemistry","Education","Law","Medicine","Linguistics","Arts & Humanities","Business / Management","Agriculture","Architecture","Geography","Political Science","Interdisciplinary"]', TRUE, 5),
('focus', 'What are your specific research keywords/topics?', 'free_text', '[]', FALSE, 6),
('focus', 'What stage are your current projects at?', 'single_choice', '["Ideation","Data Collection","Analysis","Writing","Published"]', FALSE, 7),
('focus', 'What type of research do you primarily do?', 'single_choice', '["Empirical","Theoretical","Computational","Review","Mixed"]', FALSE, 8),
('focus', 'Are you currently working on a thesis/dissertation?', 'single_choice', '["Yes – Undergrad","Yes – PhD","No"]', FALSE, 9),

-- Section C: Collaboration Goals
('collaboration', 'What are you looking for?', 'multi_choice', '["Co-author","Supervisor","Mentee","Peer reviewer","Study group","Funding partner"]', TRUE, 10),
('collaboration', 'What is your preferred collaboration style?', 'single_choice', '["Remote only","Hybrid","In-person preferred"]', FALSE, 11),
('collaboration', 'Are you open to international collaboration?', 'single_choice', '["Yes","Preferred region only","No"]', FALSE, 12),
('collaboration', 'How much time can you commit per week?', 'single_choice', '["<5 hrs","5–10 hrs","10–20 hrs","Full-time"]', FALSE, 13),
('collaboration', 'Do you need help with specific skills?', 'multi_choice', '["Statistics","Writing","Coding","Lab work","Literature review"]', FALSE, 14),

-- Section D: Publication & Journals
('publication', 'Have you published before?', 'single_choice', '["Yes – Q1/Q2","Yes – Q3/Q4","Conference only","No"]', FALSE, 15),
('publication', 'Which journal quartiles are you targeting?', 'multi_choice', '["Q1","Q2","Q3","Q4","Any"]', FALSE, 16),
('publication', 'What citation style does your field use?', 'single_choice', '["APA","IEEE","Vancouver","Chicago","Other"]', FALSE, 17),
('publication', 'Are you interested in open-access publishing?', 'single_choice', '["Yes","No","Doesn''t matter"]', FALSE, 18),

-- Section E: Community Participation
('community', 'What kind of content would you post?', 'multi_choice', '["Questions","Answers","Paper summaries","Job posts","Events"]', FALSE, 19),
('community', 'What format of help do you prefer giving/receiving?', 'multi_choice', '["Text answers","Video calls","Async feedback","Code review"]', FALSE, 20),
('community', 'Would you like to be listed as publicly discoverable?', 'single_choice', '["Full profile","Limited","No"]', FALSE, 21)

ON CONFLICT DO NOTHING;
