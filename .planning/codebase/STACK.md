# Technology Stack

## Core Language & Runtime
- **Node.js**: Backend execution environment.
- **Python**: Placeholder ML Service execution environment.
- **JavaScript (CommonJS)**: Primary language for the backend API.

## Frameworks
- **Express.js (v5)**: Primary web framework for routing and middleware.
- **FastAPI**: Python framework for the ML service component.
- **Next.js**: Frontend framework (scaffolded, not heavily developed in Week 1).

## Data & Storage Layer
- **PostgreSQL**: Primary relational database for user profiles, credentials, and structural data.
- **Redis (ioredis)**: Caching layer, session storage, and event bus (Redis Streams).
- **Neo4j**: Graph database for storing relationships between researchers, papers, and institutions.
- **Elasticsearch**: Vector-enabled search engine for semantic and keyword discovery.
- **MinIO / AWS S3**: Object storage for user avatars and document assets.

## Authentication & Security
- **JWT (jsonwebtoken)**: Stateless access token issuance.
- **bcryptjs**: Password hashing.
- **Passport.js**: Scaffolding for OAuth (Google/Github).
- **Helmet**: HTTP header security.
- **express-rate-limit**: API abuse prevention.

## Utility & Tooling
- **Joi / celebrate**: Request payload and schema validation.
- **Pino**: High-performance JSON logging.
- **Multer**: Multipart/form-data handling for file uploads.
- **Jest & Supertest**: Unit and integration testing framework.
