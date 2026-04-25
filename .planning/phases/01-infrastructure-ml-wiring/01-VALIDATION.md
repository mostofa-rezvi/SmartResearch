# Phase 1 Validation Strategy

**Phase:** 1 - Infrastructure & ML Wiring
**Date:** 2026-04-25

## Success Criteria

### INFRA-01: Docker Orchestration
- [ ] `docker-compose.yml` exists in root.
- [ ] All 6 services (backend, frontend, ml-service, postgres, redis, neo4j, elasticsearch) defined.
- [ ] Health checks implemented for all 4 database services.
- [ ] Named volumes configured for data persistence.

### INFRA-02: Environment Management
- [ ] `.env.example` contains all required variables for the 6 services.
- [ ] Backend `config/` module validates variables at startup.
- [ ] App fails to start if critical variables are missing.

### INFRA-04: ML Service Wiring
- [ ] `ml-service/Dockerfile` exists and builds successfully.
- [ ] Backend can successfully resolve and ping `ml-service` via internal network.

### CI-01: GitHub Actions
- [ ] `.github/workflows/ci.yml` exists.
- [ ] Workflow contains lint and build steps.

## Verification Methods

### Structural Audit
- `grep "healthcheck" docker-compose.yml`
- `test -f .env.example`
- `test -f .github/workflows/ci.yml`

### Integration Testing
- `docker compose up -d`
- `docker compose ps` (check for "healthy" status)
- `curl -f http://localhost:8000/docs` (ML service access)
- `npm run test:infra` (Backend script to ping all DBs)

## Threat Model (Security Gate)
- **Leakage**: Verify `.env` is in `.gitignore`.
- **Privilege**: Ensure containers run as non-root users where applicable.
- **Exposure**: Check that DB ports are only exposed to the host if explicitly needed for development.
