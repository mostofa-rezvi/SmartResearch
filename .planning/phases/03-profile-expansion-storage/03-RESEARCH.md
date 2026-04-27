# Phase 3: Profile Expansion & Storage - Research

## 1. Domain Investigation

### PostgreSQL Schema for Normalized Profiles
The phase requires `users`, `skills`, `domains`, `institutions`, and `goals`.
Proposed schema:
- `institutions`: `id`, `name`, `location`, `domain` (e.g. .edu)
- `skills`: `id`, `name`, `category`
- `domains`: `id`, `name` (Academic fields like "Computer Science", "Biology")
- `goals`: `id`, `name` (Collaboration goals like "Find Co-author", "Grant Peer Review")
- `user_skills`, `user_domains`, `user_goals`: Junction tables for many-to-many relationships.

### S3/MinIO Integration
- **Local Dev**: MinIO (standard S3-compatible API). Requires adding `minio` service to `docker-compose.yml`.
- **Backend SDK**: `@aws-sdk/client-s3` (AWS SDK v3).
- **File Handling**: `multer` for `multipart/form-data` parsing.
- **Direct Stream**: `Upload` helper from `@aws-sdk/lib-storage` is recommended for streaming large files without high memory usage.

### Profile Completeness Scoring
Logic will be implemented in a service (e.g. `profile.service.js`).
```javascript
const calculateCompleteness = (user) => {
  let score = 0;
  if (user.name && user.email) score += 10;
  if (user.bio) score += 20;
  if (user.skills?.length > 0) score += 15;
  if (user.domains?.length > 0) score += 15;
  if (user.goals?.length > 0) score += 20;
  if (user.avatar_url) score += 10;
  if (user.institution_id) score += 10;
  return score;
};
```

## 2. Codebase Patterns

- **Validation**: Current project uses `celebrate` (Joi wrapper for Express). I should continue using `Joi` with `celebrate` for middleware-level validation.
- **Models**: Project currently has an empty `src/models` directory but uses `schema.sql`. I should implement a `User` model using a query builder (like `pg` pool) or raw SQL strings in a repository pattern.
- **Controllers/Routes**: Follow existing patterns in `src/routes` and `src/controllers` (if they exist).

## 3. Infrastructure Requirements

### MinIO Docker Setup
```yaml
  minio:
    image: minio/minio:latest
    container_name: rb-minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    command: server /data --console-address ":9001"
    networks:
      - research-bridge-net
    volumes:
      - miniodata:/data

volumes:
  miniodata:
```

### New Dependencies
- `multer`
- `@aws-sdk/client-s3`
- `@aws-sdk/lib-storage`

## 4. Implementation Strategy

1. **Step 1: Infra**: Add MinIO to `docker-compose.yml` and update `.env.example`.
2. **Step 2: Schema**: Create migrations for the new tables and relationships.
3. **Step 3: Storage Service**: Implement `src/services/storage.service.js` for S3/MinIO interactions.
4. **Step 4: Validation**: Define Joi schemas for profile updates.
5. **Step 5: API**: Implement `GET` and `PUT` endpoints for profiles, including file upload and completeness scoring.

## 5. Validation Architecture

### Verification Strategy
- **Unit Tests**: Test scoring logic in isolation.
- **Integration Tests**: Test CRUD endpoints with a test DB.
- **E2E**: Verify file upload ends up in MinIO bucket.

### Success Criteria Verification
1. `GET /api/v1/profiles/me` returns expanded fields and score.
2. `PUT /api/v1/profiles/me` updates fields and re-calculates score.
3. `POST /api/v1/profiles/avatar` uploads image to MinIO and returns URL.
4. Schema migrations pass against Postgres.
