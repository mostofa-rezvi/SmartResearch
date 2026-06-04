# Milestone v1.3 Requirements: Gap Closure Milestone

## 1. Collaborative Editor (COLLAB)
- [ ] **COLLAB-EDIT-01**: Integrate `@hocuspocus/provider` or standard `y-websocket` in the frontend `collaborative-editor.tsx`.
- [ ] **COLLAB-EDIT-02**: Establish connection to the Express backend WS gateway.
- [ ] **COLLAB-EDIT-03**: Display cursor awareness / live user editing cues.

## 2. Kanban Board (KANBAN)
- [ ] **KANBAN-01**: Wire `kanban-board.tsx` and workspace pages to ProjectService endpoints.
- [ ] **KANBAN-02**: Fetch project tasks dynamically from the backend instead of static mock arrays.
- [ ] **KANBAN-03**: Persist task updates (drag and drop status changes) back to database via REST APIs.

## 3. Template Seeding (TEMP)
- [ ] **TEMP-01**: Create a `templates` directory in `frontend/public/`.
- [ ] **TEMP-02**: Seed directory with dummy LaTeX and Word templates (`ieee.docx`, `nature.docx`, etc.).
- [ ] **TEMP-03**: Clean up frontend template download links so they point to valid `/templates/` assets.

## 4. Mentorship Module (MENTOR)
- [ ] **MENTOR-01**: Create `mentorships` schema and table in PostgreSQL database.
- [ ] **MENTOR-02**: Write Express routing and controller endpoints for slot booking (`POST /mentorship/request`, `PATCH /mentorship/:id/respond`).
- [ ] **MENTOR-03**: Implement UI for requesting mentorship and managing active mentorship requests.
- [ ] **MENTOR-04**: Sync mentorship connection as `MENTORS` edge in Neo4j graph db.

## 5. Paper Tracking & History (HIST)
- [ ] **HIST-01**: Create `reading_history` log schema in PostgreSQL.
- [ ] **HIST-02**: Expose user history routes (`GET /users/me/history`).
- [ ] **HIST-03**: Log reading events on paper view/bookmarks, and wire dashboard stats dynamically.

## 6. Hardening & Security (HARD)
- [ ] **HARD-SEC-01**: Secure Socket.IO WS routes using JWT handshake authentication.
- [ ] **HARD-ML-02**: Calibrate FastAPI SBERT recommendation threshold with empirical evaluation.
