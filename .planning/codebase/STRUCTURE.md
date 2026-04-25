# Project Structure

## Mono-repo Overview
```text
/backend          # Node.js Express API
/frontend         # Next.js 16 Application
/ml-service       # Python FastAPI (Scaffolded)
/others           # Documentation and supplemental docker configs
```

## Backend Detail (`/backend`)
- `src/config/`: Database initializations (Postgres, Redis, ES, Neo4j)
- `src/controllers/`: Route handlers (mapping request to service)
- `src/middleware/`: Auth, error handling, rate limiting
- `src/models/`: SQL schema definitions (logic currently in services/schema.sql)
- `src/routes/`: Express router definitions (versioned v1)
- `src/services/`: Core business logic and database interactions
- `src/utils/`: Shared utilities (logger, email, event emitter)
- `src/validations/`: Joi/Celebrate schemas for input validation
- `schema.sql`: Principal PostgreSQL schema definition
- `openapi.yaml`: API documentation

## Frontend Detail (`/frontend`)
- `src/app/`: Next.js App Router (Pages and layouts)
- `src/components/`: Reusable React components
- `src/hooks/`: Custom React hooks (e.g., auth, socket)
- `public/`: Static assets

## Infrastructure
- `docker-compose.yml`: Orchestrates Backend, Frontend, and 4 database services.
- `Dockerfile`: Multi-stage build definitions for each service.
