# Phase 1: Infrastructure & ML Wiring - Plan

**Wave:** 1-4 | **Tasks:** 12 | **Autonomous:** true

<planning_context>
Phase 1 focuses on establishing the multi-service Docker environment.
Requirements: INFRA-01, INFRA-02, INFRA-04, CI-01.
Context: 01-CONTEXT.md, 01-RESEARCH.md, 01-VALIDATION.md.
</planning_context>

## Wave 1: Dockerization & Orchestration Base

### Task 1.1: Root Docker Compose Scaffold
- **Action**: Create `docker-compose.yml` in the project root. Define 6 services: `backend`, `frontend`, `ml-service`, `postgres`, `redis`, `neo4j`, `elasticsearch`. Configure networks (`research-bridge-net`) and named volumes (`pgdata`, `redisdata`, `neo4jdata`, `esdata`).
- **Read First**: `d:\github\SmartResearch\.planning\codebase\STACK.md`
- **Acceptance Criteria**: `docker-compose.yml` exists and defines all 6 services and 4 volumes.
- **Autonomous**: true

### Task 1.2: ML Service Dockerfile & Placeholder
- **Action**: Create `ml-service/Dockerfile` (Python 3.11-slim). Create `ml-service/main.py` with a basic FastAPI "Hello World" and a `/health` endpoint. Create `ml-service/requirements.txt` with `fastapi` and `uvicorn`.
- **Read First**: `ml-service/integration_plan.md`
- **Acceptance Criteria**: `ml-service/Dockerfile` exists. `ml-service/main.py` has `/health` endpoint returning `{"status": "ok"}`.
- **Autonomous**: true

### Task 1.3: Backend & Frontend Dockerfiles
- **Action**: Create `backend/Dockerfile` (Node 20-alpine) and `frontend/Dockerfile` (Node 20-alpine). Configure them to run `npm start` (or `npm run dev` for now).
- **Read First**: `backend/package.json`, `frontend/package.json`
- **Acceptance Criteria**: Both Dockerfiles exist and use `node:20-alpine` as base.
- **Autonomous**: true

## Wave 2: Database Hardening & ordered Startup

### Task 2.1: Implement Database Health Checks
- **Action**: Update `docker-compose.yml`. Add `healthcheck` sections to `postgres` (pg_isready), `redis` (redis-cli ping), `elasticsearch` (curl cluster health), and `neo4j` (curl http).
- **Read First**: `01-RESEARCH.md`
- **Acceptance Criteria**: `docker-compose.yml` contains `healthcheck` blocks for all 4 DB services.
- **Autonomous**: true

### Task 2.2: Configure Service Dependencies
- **Action**: Update `docker-compose.yml`. Add `depends_on` to `backend` and `ml-service` services, pointing to DBs with `condition: service_healthy`.
- **Read First**: `01-CONTEXT.md`
- **Acceptance Criteria**: `backend` service in `docker-compose.yml` depends on all 4 databases being healthy.
- **Autonomous**: true

## Wave 3: Environment & Config Validation

### Task 3.1: Root .env.example
- **Action**: Create `.env.example` in root with all required variables for backend, frontend, and databases (e.g., `POSTGRES_USER`, `NEO4J_PASSWORD`, `ES_NODE`, `ML_SERVICE_URL`).
- **Read First**: `backend/src/config/index.js`
- **Acceptance Criteria**: `.env.example` exists and contains `DATABASE_URL`, `REDIS_URL`, `NEO4J_URI`, `ELASTICSEARCH_NODE`, and `ML_SERVICE_URL`.
- **Autonomous**: true

### Task 3.2: Backend Config Schema Validation
- **Action**: Update `backend/src/config/index.js` (or create if missing). Use `zod` or `joi` to validate that all required environment variables are present and correctly formatted at startup. Throw a descriptive error if validation fails.
- **Read First**: `backend/src/index.js`
- **Acceptance Criteria**: `backend/src/config/index.js` performs validation and fails process if `DATABASE_URL` is missing.
- **Autonomous**: true

### Task 3.3: ML Service Network Visibility
- **Action**: Ensure `backend` uses `ML_SERVICE_URL=http://ml-service:8000` and `ml-service` uses internal hostnames for its dependencies if needed.
- **Read First**: `01-CONTEXT.md`
- **Acceptance Criteria**: `backend` can reach `ml-service` on port 8000 within the container network.
- **Autonomous**: true

## Wave 4: CI & Verification

### Task 4.1: GitHub Actions CI Workflow
- **Action**: Create `.github/workflows/ci.yml`. Define a job that runs on push/PR to `main`. Include steps for `actions/checkout`, `npm install` (backend/frontend), and `docker compose build`.
- **Read First**: `01-VALIDATION.md`
- **Acceptance Criteria**: `.github/workflows/ci.yml` exists and is syntactically valid (YAML).
- **Autonomous**: true

### Task 4.2: Infrastructure Verification Test
- **Action**: Create `backend/src/tests/infra.test.js`. Write a simple test that uses the existing config to ping Postgres, Redis, ES, Neo4j, and the ML Service `/health` endpoint.
- **Read First**: `01-RESEARCH.md`, `backend/src/config/`
- **Acceptance Criteria**: Running the test (locally or in container) passes when all services are up.
- **Autonomous**: true

### Task 4.3: Final Orchestration Check
- **Action**: Run `docker-compose up -d --build`. Verify all services reach "healthy" status.
- **Read First**: `docker-compose.yml`
- **Acceptance Criteria**: `docker compose ps` shows all 6 services as "Up" and DBs as "healthy".
- **Autonomous**: false

## Verification Criteria

- [ ] `docker-compose.yml` orchestrates 6 services with health checks.
- [ ] Backend validates environment variables at startup.
- [ ] Backend can communicate with the ML service.
- [ ] CI workflow is configured for push/PR validation.

## must_haves

- [ ] Successful `docker compose up -d` with all health checks passing.
- [ ] Backend config validation prevents startup on missing keys.
- [ ] `ml-service` responds to `/health` calls from backend.
