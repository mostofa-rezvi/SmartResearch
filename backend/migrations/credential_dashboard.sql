-- ============================================================
-- Researcher Credential Dashboard — Schema Migration
-- ============================================================
-- Implements proposal requirement:
--   • Append-only audit log for profile changes
--   • User achievement / badge tracking (publications, activity)
-- ============================================================

-- Profile Audit Logs (immutable, append-only)
-- Tracks every profile field change made by the user themselves.
-- Separate from admin audit_logs table which tracks moderation actions.
CREATE TABLE IF NOT EXISTS profile_audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    action VARCHAR(100) NOT NULL,         -- e.g. 'profile_update', 'avatar_update'
    changed_fields TEXT[],                -- e.g. '{bio,institution_id}'
    old_values JSONB,                     -- snapshot of previous values (no passwords)
    new_values JSONB,                     -- snapshot of incoming values
    ip_address VARCHAR(45),               -- IPv4/IPv6
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Descending index — most recent entries first per user
CREATE INDEX IF NOT EXISTS idx_profile_audit_logs_user
    ON profile_audit_logs(user_id, created_at DESC);

-- ============================================================
-- User Achievements (badges)
-- UNIQUE per (user_id, achievement_type) so level upgrades use
-- an ON CONFLICT DO UPDATE rather than inserting duplicates.
-- ============================================================
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    achievement_type VARCHAR(100) NOT NULL,    -- 'papers_saved', 'collaborator', etc.
    achievement_level VARCHAR(20) DEFAULT 'bronze'
        CHECK (achievement_level IN ('bronze', 'silver', 'gold', 'platinum')),
    achievement_data JSONB DEFAULT '{}',       -- contextual metadata (count at award, etc.)
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_type)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user
    ON user_achievements(user_id);
