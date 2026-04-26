# Coding Conventions

## Naming Standards
- **Files**: `[entity].[layer].js` (e.g., `auth.controller.js`, `profile.service.js`, `graphSync.worker.js`).
- **Variables/Functions**: camelCase.
- **Classes/Models**: PascalCase.
- **Environment Variables**: UPPER_SNAKE_CASE.

## API Standards
- **Versioning**: API paths are prefixed with `/api/v1/`.
- **Response Envelope**: Standardized JSON responses.
  - Success: `{ status: 'success', data: { ... } }`
  - Error: `{ status: 'error', message: '...' }`
- **Validation**: All incoming POST/PUT payloads MUST be validated using Joi/Celebrate before hitting the controller.

## Error Handling
- Use try/catch blocks in controllers.
- Throw custom `Error` objects or specific status code errors from services.
- Centralized error handling middleware intercepts thrown errors and formats them into the standard error envelope, preventing stack trace leakage.

## Logging
- Avoid `console.log` in production paths.
- Use the central `pino` logger (`const logger = require('../utils/logger')`) for structured JSON logging.
- Differentiate log levels: `logger.info()`, `logger.warn()`, `logger.error()`.

## Event Streaming
- Stream names should be noun-verb format: `profile.created`, `paper.published`.
- Consumer groups should be descriptive: `graph_sync_group`, `search_sync_group`.
