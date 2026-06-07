-- ============================================================
-- Document Version History — Schema Migration
-- ============================================================
-- Implements document snapshot versioning:
--   • Snapshots Yjs binary states at specific times
--   • Saves creator and text-based previews for rendering diffs
-- ============================================================

CREATE TABLE IF NOT EXISTS document_versions (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    version_name VARCHAR(255) NOT NULL,
    content_binary BYTEA NOT NULL,
    preview_text TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fast lookup for project snapshots
CREATE INDEX IF NOT EXISTS idx_document_versions_project
    ON document_versions(project_id, created_at DESC);
