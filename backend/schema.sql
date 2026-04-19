-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'admin', 'user', 'invited_user')),
    researcher_type VARCHAR(20) CHECK (researcher_type IN ('new_researcher', 'amateur_researcher')),
    status VARCHAR(50) NOT NULL, -- Keep status for active/inactive/suspended
    institution VARCHAR(255) NOT NULL,
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
    academic_bio TEXT
);

-- Invitations table for Invited Users (Academic standing)
CREATE TABLE IF NOT EXISTS invitations (
    id SERIAL PRIMARY KEY,
    inviter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    invitee_email VARCHAR(255) UNIQUE NOT NULL,
    invitee_name VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'panding' CHECK (status IN ('panding', 'accepted', 'expired')),
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
