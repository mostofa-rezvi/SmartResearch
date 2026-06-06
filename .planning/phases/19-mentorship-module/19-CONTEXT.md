# Phase 19: Mentorship Module - Context

**Gathered:** 2026-06-06
**Status:** Ready for planning

<domain>
## Phase Boundary

The Mentorship Module delivers user-to-user mentorship request capabilities, pairing status storage in Postgres, and real-time trust synchronization as a MENTORS edge in the Neo4j graph database.

</domain>

<decisions>
## Implementation Decisions

### 1. Database Schema
- **D-01:** Implement a dedicated PostgreSQL table `mentorships` using a new SQL migration file.
- **D-02:** Schema fields: `id` (SERIAL/UUID primary key), `mentor_id` (FK to users), `mentee_id` (FK to users), `status` (VARCHAR: 'pending', 'accepted', 'rejected'), `message` (TEXT, optional), and `created_at` (TIMESTAMP).

### 2. Express Backend API Routes
- **D-03:** `POST /api/mentorship/request` - Allows a user (mentee) to request mentorship from another user (mentor).
- **D-04:** `GET /api/mentorship/my` - Returns all mentorship requests/sessions where the current user is either the mentor or the mentee.
- **D-05:** `PATCH /api/mentorship/:id/respond` - Allows the mentor to accept or reject a pending request.
- **D-06:** Wrap routes with `verifyAuth` middleware.

### 3. Graph Sync
- **D-07:** When a mentorship request is accepted (transition to `accepted`), trigger an event to Neo4j to merge a `MENTORS` edge between the mentor and mentee nodes (e.g., `(mentor)-[:MENTORS]->(mentee)`).

### 4. Frontend UI
- **D-08:** Simple mentorship request form (can be mounted on researcher profile pages).
- **D-09:** Mentorship inbox/dashboard UI to display incoming requests and current mentorship status.

</decisions>

<canonical_refs>
## Canonical References

- `backend/schema.sql` — Primary database schema structure.
- `backend/src/routes/` — Reference route definitions and middleware.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `verifyAuth` middleware in backend for route guarding.
- Neo4j integration files in backend to run Cypher queries.

### Integration Points
- Express application index.js to register `/api/mentorship` router.
- Next.js navigation (Navbar.tsx) or researcher profile page to mount mentorship buttons/inbox.

</code_context>

<specifics>
## Specific Ideas

- Users should easily find their mentorship relationships on their dashboard.
- A single mentorships table is sufficient for slot and pairing tracking in the initial demo.

</specifics>

<deferred>
## Deferred Ideas

- Slot scheduling calendar integration (deferred to v2.0 mobile/SSO).

</deferred>

---
*Phase: 19-mentorship-module*
*Context gathered: 2026-06-06*
