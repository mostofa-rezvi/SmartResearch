# Testing Strategy

## Framework
- **Jest**: Primary test runner.
- **Supertest**: HTTP assertion library for integration testing the Express app.

## Test Types
1. **Unit Tests** (`*.test.js`):
   - Focus on isolated service functions, utility logic, and validation schemas.
   - Example: `auth.test.js` tests password complexity and JWT sign/verify logic.

2. **Integration Tests** (`*.integration.test.js`):
   - Test full API flows (Route -> Controller -> Service -> Model).
   - Currently, databases (Postgres, Redis) are mocked in integration tests to ensure speed and stability in CI environments without Docker dependencies.

3. **Infrastructure Probes**:
   - `infra.test.js` exists to ping database connectivity, but in runtime, `GET /health` utilizes `Promise.allSettled` to deep-probe Postgres, Redis, Neo4j, and ES concurrently.

## Coverage Goals
- Core authentication flows must have near 100% path coverage.
- Data synchronization workers (Redis Streams) should be tested for PEL recovery (currently handled via manual UAT).

## Technical Debt (Testing)
- Lack of live database integration testing. A testing environment utilizing `testcontainers` or a dedicated test `docker-compose` profile is recommended for Milestone 2.
- No End-to-End (E2E) browser testing configured yet.
