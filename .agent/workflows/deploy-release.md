# Workflow: Deploy ResearchBridge Release

This workflow ensures the platform remains a "Credentialed, Trustworthy Environment" during updates.

## Step 1: Pre-flight Checks
- All unit and integration tests pass (100% pass for Gatekeeper/OTP logic).
- Security scan for dependency vulnerabilities.
- Verification of database migrations across Postgres, Neo4j, and Elasticsearch.

## Step 2: Staging Deployment
- Deploy to isolated staging environment.
- Run Playwright E2E tests for the "8 Chapter" user journeys (Onboarding, Q&A, Search).
- Test cross-service Kafka communication for reputation scoring.

## Step 3: Production Rollout
- Use **Blue-Green Deployment** to switch traffic with zero downtime.
- Monitor Discovery Engine latency and OTP verification success rates.

## Step 4: Verification
- Inspect production logs for TrustRank anomalies.
- Verify that Super Admin invitation magic links are generating securely.