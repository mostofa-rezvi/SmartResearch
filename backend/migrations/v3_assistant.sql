CREATE TABLE IF NOT EXISTS assistant_chat_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS assistant_chat_messages (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES assistant_chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(16) NOT NULL,          -- 'user' | 'assistant'
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_assistant_msgs_session ON assistant_chat_messages(session_id, created_at);
CREATE TABLE IF NOT EXISTS assistant_summaries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  scope_key VARCHAR(255),
  result JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
