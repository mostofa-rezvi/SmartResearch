-- ============================================================================
-- Milestone v2.0 — Proposal Completion migration (idempotent)
-- Safe to run multiple times. Groups changes by module/phase.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Phase A — Module 1: Institutional verification & Trust Tiers
-- ---------------------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS trust_tier VARCHAR(20) DEFAULT 'unverified'
  CHECK (trust_tier IN ('unverified', 'basic', 'verified', 'professor'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_institutional BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS institution_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS domain_tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;
-- research_interests already exists on users; ensure default
ALTER TABLE users ADD COLUMN IF NOT EXISTS research_interests JSONB DEFAULT '[]'::jsonb;

-- ---------------------------------------------------------------------------
-- Phase B — Module 5: Threaded forum + accepted answers + TrustRank
-- ---------------------------------------------------------------------------
ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_accepted BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS accepted_comment_id INTEGER;
-- TrustRank score persisted per user (written back from Neo4j GDS PageRank)
ALTER TABLE users ADD COLUMN IF NOT EXISTS trust_rank NUMERIC(10,6) DEFAULT 0;

-- ---------------------------------------------------------------------------
-- Phase C — Module 6: Mentorship slots + sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mentorship_slots (
  id SERIAL PRIMARY KEY,
  mentor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain VARCHAR(120) NOT NULL,
  title VARCHAR(200),
  description TEXT,
  capacity INTEGER DEFAULT 1,
  taken INTEGER DEFAULT 0,
  availability VARCHAR(120),           -- free-text or ISO window
  is_open BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mentorship_slots_mentor ON mentorship_slots(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_slots_domain ON mentorship_slots(domain);

-- link a mentorship request to a slot (nullable for legacy direct requests)
ALTER TABLE mentorships ADD COLUMN IF NOT EXISTS slot_id INTEGER REFERENCES mentorship_slots(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS mentorship_sessions (
  id SERIAL PRIMARY KEY,
  mentorship_id INTEGER NOT NULL REFERENCES mentorships(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_mentorship ON mentorship_sessions(mentorship_id);

-- reputation ledger (generic points) — used by mentorship rewards & others
CREATE TABLE IF NOT EXISTS reputation_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason VARCHAR(80) NOT NULL,
  ref_type VARCHAR(40),
  ref_id VARCHAR(80),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_reputation_events_user ON reputation_events(user_id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reputation_points INTEGER DEFAULT 0;

-- ---------------------------------------------------------------------------
-- Phase H — Module 4: Knowledge Library items (papers/datasets/notes/reviews)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS library_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL DEFAULT 'paper'
    CHECK (item_type IN ('paper','dataset','note','literature_review')),
  title VARCHAR(500) NOT NULL,
  abstract TEXT,
  authors TEXT,
  doi VARCHAR(255),
  tags JSONB DEFAULT '[]'::jsonb,
  storage_key VARCHAR(500),            -- S3/MinIO object key for the PDF/file
  file_url VARCHAR(1000),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_library_items_user ON library_items(user_id);
CREATE INDEX IF NOT EXISTS idx_library_items_type ON library_items(item_type);

-- ---------------------------------------------------------------------------
-- Phase G — Module 10: real ML match-quality logging (recommendation scores)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recommendation_scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  matched_id VARCHAR(255) NOT NULL,           -- researcher_profiles.id (or user id)
  match_type VARCHAR(20) NOT NULL DEFAULT 'collaborator',
  score NUMERIC(5,4) NOT NULL,                -- normalized 0..1 ML match score
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, matched_id, match_type)
);
CREATE INDEX IF NOT EXISTS idx_rec_scores_updated ON recommendation_scores(updated_at);

-- Full extracted text (for semantic full-text search) + shared-visibility flag
ALTER TABLE library_items ADD COLUMN IF NOT EXISTS full_text TEXT;
ALTER TABLE library_items ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT TRUE;

-- ---------------------------------------------------------------------------
-- Phase F — Module 9: verifiable append-only audit log (hash chain + immutability)
-- ---------------------------------------------------------------------------
ALTER TABLE profile_audit_logs ADD COLUMN IF NOT EXISTS entry_hash VARCHAR(64);
ALTER TABLE profile_audit_logs ADD COLUMN IF NOT EXISTS prev_hash VARCHAR(64);

-- Enforce append-only at the DB level: block UPDATE/DELETE so the log is
-- genuinely immutable (a verifiable, tamper-proof academic portfolio).
CREATE OR REPLACE FUNCTION prevent_audit_mutation() RETURNS trigger AS $func$
BEGIN
  RAISE EXCEPTION 'profile_audit_logs is append-only; % is not permitted', TG_OP;
END;
$func$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_append_only ON profile_audit_logs;
CREATE TRIGGER trg_audit_append_only
  BEFORE UPDATE OR DELETE ON profile_audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();

-- ---------------------------------------------------------------------------
-- Phase J — Module 3: widen tasks.status to the kanban states (was PENDING/COMPLETED)
-- ---------------------------------------------------------------------------
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('TODO','IN_PROGRESS','REVIEW','DONE','PENDING','COMPLETED'));
ALTER TABLE tasks ALTER COLUMN status SET DEFAULT 'TODO';
