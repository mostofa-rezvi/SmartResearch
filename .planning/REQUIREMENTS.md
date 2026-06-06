# Milestone v1.4 Requirements: Mentorship & Reading History

## Shipped & Validated (Milestone v1.3)

### 1. Collaborative Editor (COLLAB)
- [x] **COLLAB-EDIT-01**: Integrate `@hocuspocus/provider` or standard `y-websocket` in the frontend `collaborative-editor.tsx`.
- [x] **COLLAB-EDIT-02**: Establish connection to the Express backend WS gateway.
- [x] **COLLAB-EDIT-03**: Display cursor awareness / live user editing cues.

### 2. Kanban Board (KANBAN)
- [x] **KANBAN-01**: Wire `kanban-board.tsx` and workspace pages to ProjectService endpoints.
- [x] **KANBAN-02**: Fetch project tasks dynamically from the backend instead of static mock arrays.
- [x] **KANBAN-03**: Persist task updates (drag and drop status changes) back to database via REST APIs.

### 3. Template Seeding (TEMP)
- [x] **TEMP-01**: Create a `templates` directory in `frontend/public/`.
- [x] **TEMP-02**: Seed directory with dummy LaTeX and Word templates (`ieee.docx`, `nature.docx`, etc.).
- [x] **TEMP-03**: Clean up frontend template download links so they point to valid `/templates/` assets.

---

## Active (Milestone v1.4)

### 4. Mentorship Module (MENTOR)
- [x] **MENTOR-01**: Create `mentorships` schema and table in PostgreSQL database.
- [x] **MENTOR-02**: Write Express routing and controller endpoints for slot booking (`POST /mentorship/request`, `PATCH /mentorship/:id/respond`).
- [x] **MENTOR-03**: Implement UI for requesting mentorship and managing active mentorship requests.
- [x] **MENTOR-04**: Sync mentorship connection as `MENTORS` edge in Neo4j graph db.

### 5. Paper Tracking & History (HIST)
- [x] **HIST-01**: Create `reading_history` log schema in PostgreSQL.
- [x] **HIST-02**: Expose user history routes (`GET /users/me/history`).
- [x] **HIST-03**: Log reading events on paper view/bookmarks, and wire dashboard stats dynamically.

---

## Future / Deferred (Milestone v1.5)

### 6. Hardening & Security (HARD)
- [ ] **HARD-SEC-01**: Secure Socket.IO WS routes using JWT handshake authentication.
- [ ] **HARD-ML-02**: Calibrate FastAPI SBERT recommendation threshold with empirical evaluation.
