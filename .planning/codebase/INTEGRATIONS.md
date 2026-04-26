# External & Internal Integrations

## Internal Systems (Docker Compose Network)
- **PostgreSQL (`postgres`)**: Accessed via `pg` driver pooling.
- **Redis (`redis`)**: Accessed via `ioredis` client. Used for caching, rate-limit state (`rate-limit-redis`), and as the primary event bus (`XADD`/`XREADGROUP`).
- **Neo4j (`neo4j`)**: Accessed via `neo4j-driver`. Managed with `initConstraints` on boot.
- **Elasticsearch (`elasticsearch`)**: Accessed via `@elastic/elasticsearch`. Initialized with `initIndices` containing `dense_vector` mappings on boot.
- **ML Service (`ml-service`)**: Internal HTTP integration. Pinged on startup; meant for downstream NLP/LLM tasks.
- **MinIO (`minio`)**: S3-compatible object storage. Accessed via `@aws-sdk/client-s3` and `@aws-sdk/lib-storage`.

## External Providers
- **OAuth Providers (Planned)**: GitHub (`passport-github2`) and Google (`passport-google-oauth20`) configured but pending frontend UI integration.
- **Email Delivery (Planned)**: Nodemailer scaffolded for future SMTP integration (OTP/Verification).

## Network Topology
- All databases and services run inside a dedicated Docker bridge network (`smart_research_net`).
- Express backend communicates with databases using internal DNS names (`postgres`, `redis`, `neo4j`, `elasticsearch`).
- The backend application exposes port 5000 to the host.
