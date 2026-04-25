# Roadmap

## Milestone v1.0: Week 1 — Infrastructure, Auth & Core Backend

**4 phases** | **14 requirements mapped** | All covered ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Infrastructure & ML Wiring | Secure and orchestrate all services | INFRA-01, INFRA-02, INFRA-04 | 2 |
| 2 | Redis Streams Event Bus | Establish reliable cross-DB sync | BUS-01, BUS-02, INFRA-03 | 2 |
| 3 | Auth Expansion & Sync | Enhance profiles and trigger events | AUTH-01, AUTH-02, AUTH-03, BUS-03 | 3 |
| 4 | Knowledge Graph & Search | Implement Neo4j and Elasticsearch | DATA-01, DATA-02, DATA-03, DATA-04 | 3 |

---

### Phase Details

#### Phase 1: Infrastructure & ML Wiring
**Goal**: Secure and orchestrate the multi-database environment and integrate the ML service.
**Requirements**:
- **INFRA-01**: Hardened Docker Compose setup with health checks.
- **INFRA-02**: Environment variable management.
- **INFRA-04**: Python FastAPI service wiring.
**Success Criteria**:
1. `docker-compose up` starts all 6 containers (backend, frontend, postgres, redis, neo4j, elasticsearch) with healthy status.
2. Backend can successfully ping the ML service over the internal network.

#### Phase 2: Redis Streams Event Bus
**Goal**: Establish a reliable event bus for real-time data synchronization.
**Requirements**:
- **BUS-01**: Redis Streams integration.
- **BUS-02**: Producer/Consumer pattern implementation.
- **INFRA-03**: CI pipeline skeleton.
**Success Criteria**:
1. Events published to Redis Streams are successfully consumed by a background worker with retry logic.
2. GitHub Action triggers on push and validates the backend build.

#### Phase 3: Auth Expansion & Sync
**Goal**: Enhance user data models and ensure registration triggers downstream sync events.
**Requirements**:
- **AUTH-01**: Expanded user profiles (academic bio, institution).
- **AUTH-02**: Secure JWT rotation.
- **AUTH-03**: RBAC gates.
- **BUS-03**: Registration sync workers.
**Success Criteria**:
1. Registration correctly populates academic profile fields in Postgres.
2. An event is emitted to Redis Streams upon registration and logged by the consumer.

#### Phase 4: Knowledge Graph & Search
**Goal**: Implement the core discovery and relationship logic using Neo4j and Elasticsearch.
**Requirements**:
- **DATA-01**: Neo4j schema definition.
- **DATA-02**: Neo4j relationship writes.
- **DATA-03**: Elasticsearch mappings.
- **DATA-04**: Semantic search logic.
**Success Criteria**:
1. New researchers are automatically added as nodes in Neo4j via sync worker.
2. Abstract searches via the `/api/v1/discovery` endpoint return fuzzy-matched results from Elasticsearch.
