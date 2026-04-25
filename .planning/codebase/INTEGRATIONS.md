# Service Integrations

## Authentication & Security
- **Two-Step OTP**: Credentials check followed by email-based OTP verification.
- **JWT Strategy**: Short-lived Access Tokens (15m) + Long-lived Refresh Tokens (7d) in HTTP-only cookies.
- **RBAC**: Role-Based Access Control (Admin, User, Invited User).
- **Onboarding**: Mandatory onboarding gate implemented via `requireOnboarding` middleware.
- **Rate Limiting**: Redis-backed limiters for general API and sensitive Auth routes.

## Data Store Sync
- **Event-Driven**: Backend emits events (e.g., `auth.user.registered`) to a shared bus.
- **Kafka Mock**: Currently uses a console-logger utility (`kafkaEmitter.js`).
- **Redis Target**: Migration path to use Redis Streams for reliable cross-service sync (Postgres -> ES/Neo4j).

## Search & Discovery
- **Elasticsearch**: Configured in `backend/src/config/elasticsearch.js`.
- **Discovery Service**: Skeleton implemented in `discovery.service.js`, currently awaiting full ES query logic.

## Graph Knowledge
- **Neo4j**: Initialized in `backend/src/config/neo4j.js`.
- **Trust Graph**: Logic planned in `reputation.service.js` to calculate research impact based on relationships.

## Notifications
- **Email**: Utility present in `backend/src/utils/email.js` for OTP and invitation delivery.
- **WebSockets**: Real-time room management (`user_{id}`) for instant feed updates via Socket.io.
