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

