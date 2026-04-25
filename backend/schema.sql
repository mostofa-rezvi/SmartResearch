-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    provider VARCHAR(50) DEFAULT 'local',
    provider_id VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'user', 'invited_user')),
    researcher_type VARCHAR(20) CHECK (researcher_type IN ('new_researcher', 'amateur_researcher')),
    status VARCHAR(50) DEFAULT 'active', -- Keep status for active/inactive/suspended
    institution VARCHAR(255),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    research_interests JSONB DEFAULT '[]',
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    login_otp VARCHAR(6),
    login_otp_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Profile table for Invited Users (higher academic standing)
CREATE TABLE IF NOT EXISTS invited_user_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100), -- Dr., Prof., Emeritus
    publications_count INTEGER DEFAULT 0,
    h_index INTEGER,
    verified_publications JSONB, -- List of verified DOIs
    academic_bio TEXT,
    department VARCHAR(255),
    ongoing_projects JSONB,
    editorial_roles JSONB,
    students_supervised INTEGER DEFAULT 0,
    conference_participation JSONB,
    contact_preferences TEXT,
    impact_score INTEGER DEFAULT 0
);

-- Invitations table for Invited Users (Academic standing)
CREATE TABLE IF NOT EXISTS invitations (
    id SERIAL PRIMARY KEY,
    inviter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    invitee_email VARCHAR(255) UNIQUE NOT NULL,
    invitee_name VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Groups Table
CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    focus_area VARCHAR(255),
    type VARCHAR(20) DEFAULT 'public' CHECK (type IN ('public', 'private')),
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Group Members Table
CREATE TABLE IF NOT EXISTS group_members (
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id)
);

-- Note: Community posts will have an optional group_id for grouping discussions.
CREATE TABLE IF NOT EXISTS community_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('question', 'thought')),
    title VARCHAR(500), -- Nullable for thoughts
    content TEXT NOT NULL,
    tags JSONB DEFAULT '[]',
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comments / Answers Table
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_answer BOOLEAN DEFAULT FALSE, -- To distinguish answers in Q&A
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Votes Table (for ranking posts and comments)
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    value INTEGER CHECK (value IN (1, -1)), -- Upvote or Downvote
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id, comment_id) -- Only one vote per item per user
);

-- Journals Table (The Library)
CREATE TABLE IF NOT EXISTS journals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    issn VARCHAR(20),
    category VARCHAR(255) NOT NULL,
    subcategory VARCHAR(255),
    quality_tier VARCHAR(2) NOT NULL CHECK (quality_tier IN ('Q1', 'Q2', 'Q3')),
    geography VARCHAR(100), -- Country or Region
    institutional_group VARCHAR(100), -- University, Association, etc.
    impact_factor DECIMAL(5, 3),
    description TEXT,
    website_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for category search
CREATE INDEX IF NOT EXISTS idx_journals_category ON journals(category);

-- Saved Papers for Researchers
CREATE TABLE IF NOT EXISTS saved_papers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    paper_title TEXT NOT NULL,
    paper_doi VARCHAR(100),
    journal_name VARCHAR(500),
    abstract TEXT,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Author Follows
CREATE TABLE IF NOT EXISTS author_follows (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, author_name)
);

-- Audit Logs (Moderation Tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id INTEGER,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content Flags (Moderation Queue)
CREATE TABLE IF NOT EXISTS content_flags (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes (DB Rule #1)
CREATE INDEX IF NOT EXISTS idx_community_posts_discovery ON community_posts(created_at DESC, type);
CREATE INDEX IF NOT EXISTS idx_votes_ranking ON votes(post_id, value) WHERE comment_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_comments_post_sorting ON comments(post_id, created_at);

-- Enhanced Integrity for Votes (Fix for Postgres NULL uniqueness)
-- Ensures a user can only vote ONCE per post (post vote)
CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_user_post_unique 
ON votes (user_id, post_id) 
WHERE comment_id IS NULL;

-- Ensures a user can only vote ONCE per comment
CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_user_comment_unique 
ON votes (user_id, comment_id) 
WHERE post_id IS NOT NULL; -- A comment vote still links to a post
