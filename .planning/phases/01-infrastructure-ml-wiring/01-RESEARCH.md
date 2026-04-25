# Phase 1: Infrastructure & ML Wiring - Research

## Research Summary

Phase 1 focus is on container orchestration and infrastructure hardening for the ResearchBridge platform. The goal is a stable environment where the Backend, Frontend, and ML Service can communicate reliably with four specialized data stores.

## Technical Findings

### 1. Multi-Database Container Orchestration
- **PostgreSQL**: Standard port 5432. Health check: `pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}`.
- **Redis**: Standard port 6379. Health check: `redis-cli ping`.
- **Elasticsearch**: Standard port 9200. Health check: `curl -f http://localhost:9200/_cluster/health`. Note: Requires `xpack.security.enabled=false` for local dev or proper cert mounting.
- **Neo4j**: Standard ports 7474 (HTTP) and 7687 (Bolt). Health check: `curl -f http://localhost:7474`. Requires `NEO4J_AUTH` env var.

### 2. ML Service (FastAPI) Integration
- **Framework**: FastAPI (Uvicorn).
- **Communication**: Internal Docker network allows services to resolve by name (`ml-service`).
- **Dependency Management**: A `requirements.txt` or `pyproject.toml` is expected in the `ml-service` directory.

### 3. Environment Validation
- **Pattern**: A `config/index.js` (Backend) using `joi` or `zod` prevents the service from starting with missing critical keys (e.g., `NEO4J_URI`, `ELASTICSEARCH_NODE`).
- **Source of Truth**: `.env.example` should be the reference for all teams.

### 4. CI/CD (GitHub Actions)
- **Workflow**: `.github/workflows/ci.yml`.
- **Steps**:
  1. Checkout code.
  2. Setup Node.js / Python environments.
  3. Run linting (`npm run lint`, `flake8`).
  4. Test Docker build: `docker compose build`.

## Validation Architecture (Nyquist)

### Dimension 8: Verification Rigor
- **Structural**: `docker-compose.yml` must contain health checks for all DBs.
- **Functional**: Backend integration test that pings all 4 databases and the ML service.
- **Security**: `.env` should not be committed (verified via `.gitignore`).
- **CI**: GitHub Actions workflow file must exist and be syntactically valid.

## Implementation Patterns

### Docker Health Check Template
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 10s
  timeout: 5s
  retries: 5
```

### Backend Config Validator (Zod)
```javascript
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  NEO4J_URI: z.string().url(),
  ELASTICSEARCH_NODE: z.string().url(),
  ML_SERVICE_URL: z.string().url(),
});
```

## Dependencies
- Phase 1 has no functional dependencies on prior code execution, but relies on the structure identified in Phase 0 (Codebase Scan).

---
*Phase: 01-infrastructure-ml-wiring*
*Research completed: 2026-04-25*
