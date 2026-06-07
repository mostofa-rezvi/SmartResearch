-- Migration 004: Link researcher_profiles to platform users
-- This enables the "Connect" button by resolving OpenAlex researchers to platform user IDs.

-- 1. Add nullable user_id FK to researcher_profiles
ALTER TABLE researcher_profiles
  ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- 2. Add openalex_id to users table so registration can link back
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS openalex_id VARCHAR(255) UNIQUE;

-- 3. Index for fast lookups in both directions
CREATE INDEX IF NOT EXISTS idx_researcher_profiles_user_id ON researcher_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_users_openalex_id ON users(openalex_id);

-- 4. Backfill: Link existing researcher_profiles to platform users by lowercased name match
--    (Best-effort; only links where a single unambiguous match exists)
UPDATE researcher_profiles rp
SET user_id = u.id
FROM users u
WHERE rp.user_id IS NULL
  AND LOWER(TRIM(u.name)) = LOWER(TRIM(rp.name))
  AND (
    SELECT COUNT(*) FROM users u2
    WHERE LOWER(TRIM(u2.name)) = LOWER(TRIM(rp.name))
  ) = 1;
