# Directory Structure

## Repository Root
- `.planning/` - GSD AI agent state, milestones, and planning documents.
- `backend/` - Node.js Express API.
- `frontend/` - Next.js UI (Scaffold).
- `ml-service/` - Python FastAPI application.
- `docker-compose.yml` - Main orchestration file.

## Backend Structure (`backend/src/`)
- `config/` - Database initialization and environment bindings (`db.js`, `redis.js`, `neo4j.js`, `elasticsearch.js`).
- `controllers/` - HTTP request handlers (e.g., `auth.controller.js`, `profile.controller.js`).
- `middleware/` - Express middlewares (`auth.js`, `error.js`, `rateLimiter.js`).
- `routes/` - Express router definitions (`auth.routes.js`, `profile.routes.js`).
- `services/` - Business logic and event orchestration (`auth.service.js`, `eventBus.service.js`, `storage.service.js`).
- `utils/` - Shared utilities.
- `validations/` - Joi schema definitions for payload validation (`profile.validation.js`).
- `workers/` - Background processes for Redis Streams consumption (`graphSync.worker.js`, `searchSync.worker.js`).
- `tests/` - Unit and integration test suites.
- `index.js` - Application entry point, Express configuration, worker bootstrapping, and deep health check logic.
