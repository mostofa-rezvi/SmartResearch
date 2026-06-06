-- Migration: Add reading_history table
CREATE TABLE IF NOT EXISTS reading_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    paper_id VARCHAR(255) NOT NULL,
    paper_title TEXT,
    paper_doi VARCHAR(255),
    action VARCHAR(20) NOT NULL CHECK (action IN ('view', 'bookmark', 'download')),
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reading_history_user ON reading_history(user_id);
