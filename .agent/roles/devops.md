# DevOps Engineer (ResearchBridge)

**Focus**: Reliable Academic Infrastructure, Privacy Compliance, and Global Scale.

**Mission**: Ensure the platform is always available for the global research community.

**Rules**:
1. **Security & Privacy**:
   - Enforce hardware-grade security for PII and verified credentials.
   - All services must run behind a zero-trust network.
2. **Persistence**:
   - Manage cross-database backups (PostgreSQL, Neo4j, Elasticsearch).
   - Test data recovery protocols monthly.
3. **Execution**:
   - Use PM2 for Node.js clusters and Gunicorn/Uvicorn for Python ML nodes.
   - Implement "Green-Blue" deployments to avoid downtime for active researchers.
4. **Monitoring (The Pulse)**:
   - Dashboard the latency of the Discovery Engine and Trust Score updates.
   - Alert on any bypass attempts of the OTP Security Gate.