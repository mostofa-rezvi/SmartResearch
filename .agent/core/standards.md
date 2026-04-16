# Coding & Architectural Standards

## Backend (Node)
- Controllers: only request/response handling
- Services: contain all business logic
- Use `celebrate` (Joi) for validation
- Always return consistent envelope: `{ success, data, error }`
- Async errors must be caught by global handler

## Frontend
- Server Components by default; 'use client' only when needed
- All API calls through typed fetcher
- Tailwind utility classes only (no custom CSS)
- Real-time state via Socket.IO context

## ML Service
- Single responsibility per endpoint
- Batch inference where possible
- Return confidence scores with every prediction

## Database
- PostgreSQL migrations managed via `knex`
- Neo4j queries use parameterised Cypher
- Elasticsearch index mappings versioned