# Phase 1 Code Review: Infrastructure & ML Wiring

**Phase:** 01
**Date:** 2026-04-25
**Focus:** Docker security, env variable exposure, CI config.

## Summary

The Phase 1 infrastructure scaffold successfully sets up the core multi-container environment. The structural implementation is solid, but there are a few security and best-practice considerations typical of an initial scaffold that should be addressed before moving to a production environment.

## Findings

### 1. Docker Security & Network Exposure (Medium Severity)
- **Port Bindings**: The databases (Postgres, Redis, Neo4j, Elasticsearch) expose their standard ports to all interfaces (e.g., `5432:5432`). For local development, binding to localhost (`127.0.0.1:5432:5432`) is safer to prevent external network access. For production, these ports shouldn't be exposed at all; services should communicate exclusively over the internal `research-bridge-net`.
- **Elasticsearch Security**: `xpack.security.enabled=false` is currently set. While necessary for a quick local start, this must be enabled with properly configured TLS and role-based access before handling actual user data.
- **Root Users**: The `backend`, `frontend`, and `ml-service` Dockerfiles do not currently specify a non-root user (e.g., `USER node`). Running application containers as root is a security risk.

### 2. Environment Variable Exposure (Low/Medium Severity)
- **Secret Management**: The `.env.example` file correctly placeholders sensitive values (e.g., `JWT_ACCESS_SECRET`). However, prior to this review, there was no `.gitignore` file, which risked accidental commit of the actual `.env` file. **(Resolved during review: `.gitignore` has been added).**
- **Vault Pattern Implementation**: The backend uses `Joi` to enforce the presence of environment variables. While this prevents the app from starting in a broken state, it is not a true "Vault pattern." Future phases should consider integrating a dedicated secrets manager or a tool like `dotenv-vault` if dynamic secret rotation is required.

### 3. CI Pipeline Configuration (Low Severity)
- **Action Versions**: The `.github/workflows/ci.yml` file uses `actions/checkout@v3` and `actions/setup-node@v3`. The latest stable versions (v4) should be used.
- **Test Execution**: The CI pipeline currently builds the Docker images but does not run the `npm run test:infra` script. The infrastructure tests should be incorporated into the CI workflow.

## Recommendations for Future Phases

1. **Harden Docker Compose**: Update database port mappings to `127.0.0.1:PORT:PORT` for local dev.
2. **Container Users**: Add `USER node` to Node.js Dockerfiles and create a non-root user in the Python Dockerfile.
3. **CI Expansion**: Update GitHub Actions to v4 and add a step to run `npm run test:infra` (potentially using service containers in GitHub Actions).

---
*Generated autonomously via gsd-code-review.*
