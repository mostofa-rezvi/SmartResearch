# System Architecture

## Patterns & Principles
- **Controller-Service-Model (CSM)**: Backend separation of concerns for maintainability.
- **Envelope-Pattern**: Unified JSON response structure across all API endpoints.
- **Centralized Error Handling**: Middleware-driven error management with Joi/Celebrate validation.
- **Stateless API**: JWT-based authentication to ensure horizontal scalability.

## Data Flow
1. **Primary Write**: `Backend` -> `PostgreSQL`
2. **Event Emit**: `Backend` -> `Event Bus (Redis Streams)`
3. **Downstream Consume**: `Sync Workers` -> `Elasticsearch` / `Neo4j`
4. **Read/Search**: `Frontend` -> `Backend` -> `Elasticsearch` / `Neo4j`

## Security Layer
- **Helmet**: Secures Express apps by setting various HTTP headers.
- **CORS**: Strict origin whitelist configured from environment variables.
- **CSRF Protection**: Mitigated via SameSite cookies and custom header requirements for JWT.
- **Input Validation**: Strict schema enforcement using Joi at the route level.

## Deployment
- **Containerization**: Single `docker-compose.yml` orchestrates the local development environment.
- **Service Isolation**: Backend and Databases run in separate containers, communicating over a private Docker network.
