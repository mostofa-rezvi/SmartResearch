# Requirements

## Milestone v1.0: Week 1 — Infrastructure, Auth & Core Backend

### INFRA: Infrastructure & DevOps
- [ ] **INFRA-01**: Hardened Docker Compose setup with health checks and volume persistence for all 4 databases.
- [ ] **INFRA-02**: Environment variable management using a robust configuration service (e.g., `dotenv` + validation).
- [ ] **INFRA-03**: GitHub Actions CI pipeline skeleton for linting and container builds.
- [ ] **INFRA-04**: Python FastAPI service wired into the backend network and orchestrated via Docker.

### AUTH: Auth & Profiles
- [ ] **AUTH-01**: Expanded user profiles in PostgreSQL including academic bio, titles, and institution verification status.
- [ ] **AUTH-02**: Enhanced JWT handling with secure rotation and logout blacklisting (Redis-backed).
- [ ] **AUTH-03**: Role-specific permission gates (RBAC) for Admin/Moderator actions.

### BUS: Event Bus & Sync
- [ ] **BUS-01**: Implement Redis Streams integration to replace the mock Kafka emitter.
- [ ] **BUS-02**: Create generic event consumer/producer pattern for reliable Postgres-to-ES/Neo4j sync.
- [ ] **BUS-03**: Implement `USER_REGISTERED` and `PROFILE_UPDATED` sync workers.

### DATA: Knowledge & Search
- [ ] **DATA-01**: Define Neo4j schema and constraints for `Researcher`, `Paper`, and `Group` nodes.
- [ ] **DATA-02**: Implement basic Neo4j relationship writes (AUTHORED_BY, MEMBER_OF).
- [ ] **DATA-03**: Elasticsearch index templates and mapping definition for papers and researcher discovery.
- [ ] **DATA-04**: Implement semantic search service logic in `discovery.service.js`.

## Future Requirements
- **REPUT-01**: Reputation score algorithm using Neo4j centrality.
- **GROUP-01**: Complex collaboration group permissions and visibility.

## Out of Scope
- **Payment Processing**: Deferred to Milestone 3.
- **Frontend Dashboard Visuals**: Focusing on data plumbing and backend infra this week.

## Traceability
(To be updated by roadmapper)
