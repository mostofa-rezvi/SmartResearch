---
wave: 1
depends_on: []
files_modified:
  - backend/schema.sql
  - backend/src/routes/mentorship.js
  - backend/src/index.js
  - frontend/src/components/profile/MentorshipRequestForm.tsx
  - frontend/src/components/profile/MentorshipInbox.tsx
autonomous: true
---

# Phase 19: Mentorship Module

## 1. Database Schema
<task>
<read_first>
- backend/schema.sql
</read_first>
<action>
Append the following table definition to `backend/schema.sql`:

```sql
-- Mentorships Table
CREATE TABLE IF NOT EXISTS mentorships (
    id SERIAL PRIMARY KEY,
    mentor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    mentee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
</action>
<acceptance_criteria>
- `backend/schema.sql` contains `CREATE TABLE IF NOT EXISTS mentorships` with `mentor_id`, `mentee_id`, `status`, `message`, and `created_at` fields.
</acceptance_criteria>
</task>

## 2. API Routes & Controller
<task>
<read_first>
- backend/src/index.js
- backend/src/routes/mentorship.js
</read_first>
<action>
Create a new Express router at `backend/src/routes/mentorship.js`:
- Use `verifyAuth` middleware.
- `POST /request`: Insert into `mentorships` (mentee_id = req.user.id, mentor_id = req.body.mentor_id, message = req.body.message).
- `GET /my`: Select from `mentorships` where `mentor_id = req.user.id` or `mentee_id = req.user.id`.
- `PATCH /:id/respond`: Update `status` ('accepted' or 'rejected') where id = req.params.id and mentor_id = req.user.id. If 'accepted', run Neo4j sync to merge `(mentor:User {id: mentor_id})-[:MENTORS]->(mentee:User {id: mentee_id})`.

Register router in `backend/src/index.js` at `/api/mentorship`.
</action>
<acceptance_criteria>
- `backend/src/routes/mentorship.js` exports a router.
- `backend/src/index.js` contains `app.use('/api/mentorship', ...)`
- `backend/src/routes/mentorship.js` contains `router.post('/request'`, `router.get('/my'`, `router.patch('/:id/respond'`.
- Neo4j query for `MENTORS` edge is present in the `respond` endpoint.
</acceptance_criteria>
</task>

## 3. Frontend UI
<task>
<read_first>
- frontend/src/components/profile/MentorshipRequestForm.tsx
- frontend/src/components/profile/MentorshipInbox.tsx
</read_first>
<action>
Create `frontend/src/components/profile/MentorshipRequestForm.tsx`:
- A React component taking `mentorId`.
- Includes a textarea for `message` and a submit button calling `POST /api/mentorship/request`.

Create `frontend/src/components/profile/MentorshipInbox.tsx`:
- Fetches from `GET /api/mentorship/my`.
- Displays pending incoming requests with Accept/Reject buttons (calling `PATCH /api/mentorship/:id/respond`).
- Displays active mentorships.
</action>
<acceptance_criteria>
- `frontend/src/components/profile/MentorshipRequestForm.tsx` contains a form invoking `/api/mentorship/request`.
- `frontend/src/components/profile/MentorshipInbox.tsx` contains fetch logic for `/api/mentorship/my` and accept/reject handlers.
</acceptance_criteria>
</task>

## Verification
- Start the server and check for syntax errors.
- Run `npm run test` or check backend API endpoints manually.
