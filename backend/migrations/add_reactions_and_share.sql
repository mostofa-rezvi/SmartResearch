-- Migration: Add reactions, share_count, and fix votes unique constraint
-- Run this against the database to add the new features

-- 1. Add share_count to community_posts
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;

-- 2. Fix type column check (service uses 'Question'/'Thought', schema checks 'question'/'thought')
ALTER TABLE community_posts DROP CONSTRAINT IF EXISTS community_posts_type_check;
ALTER TABLE community_posts ADD CONSTRAINT community_posts_type_check CHECK (type IN ('Question', 'Thought', 'question', 'thought'));

-- 3. Post Reactions Table (LinkedIn-style: 5 reaction types)
CREATE TABLE IF NOT EXISTS post_reactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('insightful', 'support', 'curious', 'celebrate', 'love')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);

-- 4. Fix votes unique constraint (Postgres treats NULL != NULL so the original UNIQUE fails)
-- Drop old constraint if it exists
DROP INDEX IF EXISTS idx_votes_user_post_comment;
CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_post_user 
    ON votes(user_id, post_id) WHERE comment_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_comment_user 
    ON votes(user_id, comment_id) WHERE comment_id IS NOT NULL;
