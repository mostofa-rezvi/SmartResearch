-- v4: Discovery "Connect" collaboration flow.
-- A user sends a research proposal to a recommended researcher. If the
-- researcher has a platform account they must accept before a team (project)
-- is auto-created; researchers without an account are attached to the new
-- team as external collaborators (project_external_collaborators).

CREATE TABLE IF NOT EXISTS collaboration_requests (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Platform account of the recipient; NULL when the researcher has not registered yet.
    recipient_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    -- OpenAlex author id (researcher_profiles.id), kept even for registered users.
    recipient_researcher_id VARCHAR(255),
    recipient_name VARCHAR(500) NOT NULL,
    recipient_institution VARCHAR(500),
    proposal_title VARCHAR(255) NOT NULL,
    proposal_message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    -- The team auto-created when the request is accepted.
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_collab_req_requester ON collaboration_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_collab_req_recipient ON collaboration_requests(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_collab_req_status ON collaboration_requests(status);

-- Researchers who are part of a team but have no users row (OpenAlex-only).
CREATE TABLE IF NOT EXISTS project_external_collaborators (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    researcher_id VARCHAR(255),
    name VARCHAR(500) NOT NULL,
    institution VARCHAR(500),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (project_id, researcher_id)
);

CREATE INDEX IF NOT EXISTS idx_proj_ext_collab_project ON project_external_collaborators(project_id);
