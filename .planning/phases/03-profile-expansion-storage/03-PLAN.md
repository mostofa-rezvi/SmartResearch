# Phase 3: Profile Expansion & Storage - Plan

**Phase:** 3
**Goal:** Implement comprehensive user profiles with normalized data, S3 storage, and completeness scoring.

## Waves

### Wave 1: Infrastructure & Schema
- [ ] Task 1: Add MinIO to Docker Compose and update ENV
- [ ] Task 2: Create SQL migration for new profile tables
- [ ] Task 3: Install new dependencies (multer, aws-sdk)

### Wave 2: Core Services & Validation
- [ ] Task 4: Implement S3/MinIO Storage Service
- [ ] Task 5: Define Joi validation schemas for profiles
- [ ] Task 6: Implement Profile Completeness Scoring Service

### Wave 3: API Endpoints & Integration
- [ ] Task 7: Implement Profile CRUD Controller (GET/PUT)
- [ ] Task 8: Implement Avatar Upload Controller
- [ ] Task 9: Register Profile Routes and Verify Integration

---

## Task Details

### Wave 1: Infrastructure & Schema

#### Task 1: Add MinIO to Docker Compose and update ENV
- **Action**: Add `minio` service to `docker-compose.yml`. Update `.env.example` with `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_ENDPOINT`.
- **Read First**: `docker-compose.yml`, `.env.example`
- **Acceptance Criteria**:
  - `docker-compose.yml` contains `minio` service.
  - `.env.example` contains S3 configuration keys.

#### Task 2: Create SQL migration for new profile tables
- **Action**: Add SQL statements to `backend/schema.sql` (or a new migration file if preferred, but `schema.sql` is current pattern) to create `skills`, `domains`, `institutions`, `goals` and junction tables.
- **Read First**: `backend/schema.sql`
- **Acceptance Criteria**:
  - `backend/schema.sql` includes tables: `skills`, `domains`, `institutions`, `goals`, `user_skills`, `user_domains`, `user_goals`.
  - Proper foreign keys and indexes are defined.

#### Task 3: Install new dependencies (multer, aws-sdk)
- **Action**: Run `npm install multer @aws-sdk/client-s3 @aws-sdk/lib-storage` in `backend` directory.
- **Read First**: `backend/package.json`
- **Acceptance Criteria**:
  - `backend/package.json` contains the new packages.

### Wave 2: Core Services & Validation

#### Task 4: Implement S3/MinIO Storage Service
- **Action**: Create `backend/src/services/storage.service.js`. Implement `uploadFile` and `getSignedUrl` (optional, for now public access might be easier for local).
- **Read First**: `backend/src/config/` (to see how S3 config is loaded)
- **Acceptance Criteria**:
  - `storage.service.js` exports a functional S3 client and upload helper.

#### Task 5: Define Joi validation schemas for profiles
- **Action**: Create `backend/src/validations/profile.validation.js`. Define schemas for updating profile fields.
- **Read First**: `backend/src/validations/` (if any existing)
- **Acceptance Criteria**:
  - Joi schemas cover all new profile fields (bio, skills, goals, etc.).

#### Task 6: Implement Profile Completeness Scoring Service
- **Action**: Create `backend/src/services/profile.service.js`. Implement `calculateCompleteness` logic.
- **Read First**: `03-RESEARCH.md` (for weights)
- **Acceptance Criteria**:
  - `profile.service.js` correctly calculates score based on user object field occupancy.

### Wave 3: API Endpoints & Integration

#### Task 7: Implement Profile CRUD Controller (GET/PUT)
- **Action**: Create `backend/src/controllers/profile.controller.js`. Implement `getProfile` and `updateProfile`.
- **Read First**: `backend/src/controllers/` (for existing patterns)
- **Acceptance Criteria**:
  - `getProfile` returns the user with joined skills/domains/goals and the completeness score.
  - `updateProfile` updates the user and its associated many-to-many records.

#### Task 8: Implement Avatar Upload Controller
- **Action**: Add `uploadAvatar` to `profile.controller.js`. Use `multer` middleware and `storage.service`.
- **Read First**: `backend/src/routes/`
- **Acceptance Criteria**:
  - `POST /api/v1/profiles/avatar` successfully saves file to MinIO and updates `users.avatar_url`.

#### Task 9: Register Profile Routes and Verify Integration
- **Action**: Create `backend/src/routes/profile.routes.js` and register it in `backend/src/index.js`.
- **Read First**: `backend/src/index.js`
- **Acceptance Criteria**:
  - Endpoints are accessible at `/api/v1/profiles/...`.
  - Integration test (manual or automated) confirms full flow.

---

## Verification Criteria (must_haves)
- [ ] All new tables exist in PostgreSQL.
- [ ] Profile GET returns `completeness_score`.
- [ ] MinIO bucket receives uploaded avatars.
- [ ] Joi validation blocks invalid profile updates.
