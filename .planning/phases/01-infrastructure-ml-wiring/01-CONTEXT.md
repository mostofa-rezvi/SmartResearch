# Phase 1: Infrastructure & ML Wiring - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish a production-ready mono-repo scaffold using Docker Compose, orchestrating the Backend (Node/Express), Frontend (Next.js), and ML Service (Python FastAPI) alongside four primary data stores: PostgreSQL (Core), Redis (Bus/Cache), Neo4j (Graph), and Elasticsearch (Search).

</domain>

<decisions>
## Implementation Decisions

### Docker Orchestration
- **D-01:** Use a unified `docker-compose.yml` in the root directory for all services and databases.
- **D-02:** Implement native Docker `healthcheck` commands for all database containers (Postgres, Redis, ES, Neo4j).
- **D-03:** Use `depends_on` with `condition: service_healthy` to ensure ordered startup (DBs -> Backend -> ML Service).
- **D-04:** Persist all database data via named volumes (e.g., `pgdata`, `esdata`) to prevent data loss on container restart.

### Environment & Secrets
- **D-05:** Use `.env` for local development, managed via `dotenv`.
- **D-06:** Implement a central `config/` module in the backend that validates required environment variables at startup using a schema (e.g., Joi or Zod).
- **D-07:** Maintain a comprehensive `.env.example` in the root to document all required integration keys and service URLs.

### ML Service Integration
- **D-08:** Python FastAPI service will expose a REST API on port 8000.
- **D-09:** Communication between Backend and ML service will happen over the internal Docker network via `http://ml-service:8000`.

### CI/CD Foundation
- **D-10:** Initialize a GitHub Actions workflow `.github/workflows/ci.yml`.
- **D-11:** CI will run on every Pull Request and push to `main`, performing linting (Node and Python) and verifying Docker builds.

### the agent's Discretion
- Exact Docker base image versions (e.g., `node:20-alpine` vs `node:20-slim`).
- Specific health check intervals and timeout values.
- Choice of validation library for environment variables (Joi vs Zod).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/PROJECT.md` — Project vision, core values, and tech stack constraints.
- `.planning/REQUIREMENTS.md` — Specific INFRA requirements for Phase 1.
- `.planning/codebase/STACK.md` — Detailed technology versions and architecture notes.

### Existing Logic
- `backend/src/index.js` — Entry point for the Express API.
- `backend/src/config/` — Existing database connection utility scripts.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/src/config/*.js`: Existing connection logic for Postgres, Redis, ES, and Neo4j can be lifted into the final containerized environment.
- `backend/src/utils/logger.js`: Standardized logging pattern for service startup messages.

### Established Patterns
- **CSM (Controller-Service-Model)**: The backend already follows this pattern; new infra code should support this separation of concerns.

### Integration Points
- **Docker Network**: All services will be bridged on a dedicated `research-bridge-net`.
- **API Versioning**: Infra must support the existing `/api/v1` routing structure.

</code_context>

<deferred>
## Deferred Ideas
- **Redis Streams Event Bus**: While the infra is set up here, the actual implementation of the bus logic is Phase 2.
- **GitHub Actions Deployment**: CD (Deployment) is deferred until a hosting provider is finalized; Phase 1 only covers CI (Integration).

</deferred>

---

*Phase: 01-infrastructure-ml-wiring*
*Context gathered: 2026-04-25*
