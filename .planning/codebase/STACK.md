# Technology Stack

## Core Frameworks
- **Frontend**: [Next.js 16](https://nextjs.org/) (React 19, TypeScript)
- **Backend**: [Node.js](https://nodejs.org/) with [Express](https://expressjs.com/)
- **ML Service**: [Python 3.12+](https://www.python.org/) with [FastAPI](https://fastapi.tiangolo.com/) (Planned/Scaffolded)

## Databases & Persistence
- **PostgreSQL 16**: Primary source of truth for users, academic metadata, and transactions.
- **Redis 7**: Used for caching, rate-limiting (OTP), and planned event-driven messaging (Streams).
- **Neo4j 5**: Knowledge/Trust graph modeling citations, authorship, and researcher relationships.
- **Elasticsearch 8**: Semantic search, fuzzy matching, and faceted discovery.

## Communication & Real-time
- **REST API**: Centralized communication between Frontend and Backend (versioned v1).
- **Socket.io**: Real-time updates for research feeds and notifications.
- **Redis Streams**: Target for event-driven synchronization between data stores (replacing Kafka mock).

## Styling & UI
- **Tailwind CSS 4**: Modern utility-first styling.
- **Framer Motion**: Smooth animations and micro-interactions.
- **Lucide React**: Iconography.

## Operations
- **Docker**: Containerized environment for all services and databases.
- **Docker Compose**: Orchestration of the multi-database environment.
