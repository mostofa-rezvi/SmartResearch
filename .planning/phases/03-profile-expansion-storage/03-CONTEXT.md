# Phase 3: Profile Expansion & Storage - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers an expanded user profile system with normalized relational data for skills, domains, institutions, and goals. It includes secure file uploads (avatars) via S3/MinIO and a profile completeness scoring algorithm.

</domain>

<decisions>
## Implementation Decisions

### 1. Database Schema (PostgreSQL)
- **Normalization**: Separate tables for `skills`, `domains`, `institutions`, and `goals`.
- **Relationships**: Many-to-many between `users` and `skills`/`domains`/`goals` via junction tables.
- **Institutions**: Users belong to one institution (one-to-many or many-to-many depending on if they can have multiple, assume one for now per previous schema).

### 2. Validation & CRUD
- **Framework**: Use `Joi` for request validation (already a project dependency).
- **CRUD**: Full endpoints for `GET /profiles/me`, `PUT /profiles/me`.
- **Partial Updates**: Support `PATCH` or partial `PUT` for profile fields.

### 3. Storage (MinIO/S3)
- **Local**: Use MinIO container (already in docker-compose).
- **Production**: AWS S3.
- **Method**: Direct streaming from backend to S3 to keep frontend simple and enforce file size/type constraints at the API layer.
- **Asset**: `avatar_url` stored in `users` table.

### 4. Profile Completeness Logic
- **Algorithm**: Weighted scoring based on field occupancy.
- **Weights**:
  - Name/Email: 10% (Basic)
  - Bio: 20%
  - Domains/Skills: 30%
  - Goals: 20%
  - Avatar: 10%
  - Institution: 10%
- **Output**: Returned as a `completeness_score` field in the profile response.

### the agent's Discretion
- Exact table names (e.g., `user_skills` vs `users_skills`).
- Error message wording for validation failures.
- MinIO bucket naming and public/private policy implementation details.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database & Schema
- `backend/schema.sql` — Existing database structure
- `backend/src/index.js` — Core application entry and middleware

### Configuration
- `backend/.env.example` — Environment variable patterns

</canonical_refs>

<specifics>
## Specific Ideas
- Use `multer` or `express-fileupload` for handling multipart requests.
- Ensure `Joi` schemas are modular and reusable across create/update operations.

</specifics>

<deferred>
## Deferred Ideas
- Social media link integration (deferred to v1.1).
- Advanced researcher verification workflow (deferred to Milestone 2).
- Batch skill imports from LinkedIn/ORCID.

</deferred>

---

*Phase: 03-profile-expansion-storage*
*Context gathered: 2026-04-26 via Discussion*
