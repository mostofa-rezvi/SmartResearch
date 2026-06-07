-- Migration: Add connections and notifications tables
-- Run: psql $DATABASE_URL -f migrations/add_connections_notifications.sql

-- =============================================
-- Connections Table
-- Tracks researcher-to-researcher connections
-- =============================================
CREATE TABLE IF NOT EXISTS connections (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(requester_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_connections_recipient ON connections(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_requester ON connections(requester_id, status);

-- =============================================
-- Notifications Table
-- Persistent inbox — survives offline sessions
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,         -- 'connection_request', 'connection_accepted', 'mentorship_accepted', 'forum_reply', 'match'
    title TEXT NOT NULL,
    body TEXT,
    meta JSONB DEFAULT '{}',           -- e.g. { "from_user_id": 42, "post_id": 7 }
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
