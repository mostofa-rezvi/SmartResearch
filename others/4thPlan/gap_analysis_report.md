# SmartResearch (ResearchBridge) Gap Analysis Report

Based on a comprehensive review of the live codebase, database migrations, and the original project proposal & overview documents, the vast majority of the core features have been successfully implemented (standing at ~90% complete).

Features that have been recently **completed** include complex implementations like the *Mentorship Module*, *AMA Sessions*, *Peer Review*, *Document Versioning*, *LLM Publication Assistant*, and the *Researcher Credential Dashboard*.

However, there are still a few **incomplete areas** or technical deviations from the original proposal that need to be addressed to achieve 100% compliance.

## Incomplete Parts & Deviations (The Gaps)

### 1. Kafka Event Bus (Deep Infrastructure)
> [!WARNING]
> The proposal explicitly mandates **Apache Kafka** for the async event pipeline. The current implementation pragmatically uses **Redis Streams + PostgreSQL**.

**What to do to complete it:**
- Replace the Redis `XREADGROUP` worker logic (`graphSync.worker`, `searchSync.worker`) with Kafka consumers.
- Integrate `kafkajs` in the Node.js backend.
- Update `docker-compose.yml` to include Kafka brokers instead of relying solely on Redis for message queues.

### 2. Cloud Storage Migration (Cloudflare R2 / DigitalOcean)
> [!NOTE]
> The proposal requires PDFs to be stored in **Cloudflare R2 or Digital Ocean Spaces**. The current system uses **MinIO** for local object storage.

**What to do to complete it:**
- Provision a bucket on Cloudflare R2 or DigitalOcean Spaces.
- Update the `.env` variables (`S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`) for production.
- Verify that the Node.js `StorageService` (which uses S3-compatible SDKs for MinIO) connects and streams correctly to the external cloud provider.

### 3. Behavioral Signal Feedback Loop for ML
> [!IMPORTANT]
> The proposal states that Collaborative Filtering improves dynamically as "behavioral signals (reads, bookmarks, comments) accumulate." Currently, these actions are logged in the database, but they do not automatically trigger a recalculation of the user's ML embeddings or CF weights.

**What to do to complete it:**
- Modify the FastAPI ML microservice to listen for "bookmark", "read", and "comment" events from the backend.
- Implement an automated pipeline to periodically recalculate the CSR matrices (`matrix_builder.py`) and adjust recommendation scores (`scorer.py`) based on these accumulating actions.

### 4. Advanced & Future Scope Items (v2.0 Roadmap)
> [!TIP]
> The following items are strategic roadmap features for scaling, which have not been started:

**What to do to complete it:**
- **Institutional SSO:** Implement SAML/OIDC logic to allow true Single Sign-On for `.edu` domains.
- **API Marketplace:** Secure and expose the GraphQL v2 and FastAPI endpoints via API keys for third-party developer access.
- **Native Mobile App:** Build a cross-platform (React Native/Flutter) application for on-the-go notifications and discovery.
