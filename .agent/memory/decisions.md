# Architecture Decision Records (ADRs)

> Maintained by the System Architect Agent per `roles/architect.md` §Documentation rule.

---

## ADR-001: Dual-Token JWT Strategy

**Date**: 2026-04-19  
**Status**: Accepted  
**Context**: The initial auth implementation issued a single 24h JWT token. This violates Zero Trust principles (long-lived tokens are a large attack surface if stolen).  
**Decision**: Implement a dual-token strategy:
- **Access Token**: 15-minute expiry, sent in response body, stored in-memory on client.
- **Refresh Token**: 7-day expiry, sent as `httpOnly`, `SameSite=Strict` cookie (not accessible to JS — XSS-resistant).
- A new `/api/v1/auth/refresh` endpoint issues new access tokens from the cookie.
**Consequences**: `cookie-parser` middleware added to backend. CORS updated with `credentials: true`. Frontend must send `credentials: 'include'` on refresh calls.

---

## ADR-002: Centralized API Configuration

**Date**: 2026-04-19  
**Status**: Accepted  
**Context**: 23 hardcoded `http://localhost:5000` URLs were scattered across 11 frontend files. This makes environment transitions (dev → staging → production) fragile and violates the Domain Integrity rule.  
**Decision**: Created `frontend/src/config/api.ts` as the single source of truth for all API endpoints, organized by domain (auth, community, discovery, library, groups, users, admin). All pages import from this file.  
**Consequences**: Zero hardcoded hostnames in feature code. Switching to production is a one-line env change.

---

## ADR-003: Onboarding Enforcement at API Layer

**Date**: 2026-04-19  
**Status**: Accepted  
**Context**: The "First Conversation" (Onboarding) constraint requires users cannot access core platform features until onboarding is complete. This was only enforced on the frontend (easily bypassed by direct API calls).  
**Decision**: Created `requireOnboarding` middleware that checks `req.user.onboarding_completed` flag embedded in the JWT. Applied to all write routes in `community`, `discovery`, and `groups` modules.  
**Consequences**: Onboarding is now enforced at the API boundary, not just in the UI. The constraint cannot be bypassed by API clients.

---

## ADR-004: Event-Driven Cross-Module Integration

**Date**: 2026-04-19  
**Status**: ~~Partially Accepted~~ → **SUPERSEDED by ADR-006**  
**Context**: The architect rule states "prefer event-driven events for cross-module actions." Three critical cross-domain events were identified:
1. `community.post.created` → triggers TrustScore engine update
2. `library.paper.saved` → triggers ML recommendation model update  
3. `community.group.joined` → triggers social graph update in Neo4j

**Decision**: Emit events at these action points using a `kafkaEmitter` utility. Currently mock (`console.log`) — see ADR-006 for the production implementation.  
**Consequences**: Every key action that affects the Trust Score or Recommendation Engine now emits a typed event. See ADR-006 for the Redis Streams replacement.

---

## ADR-005: Standard Response Envelope

**Date**: 2026-04-18  
**Status**: Accepted  
**Context**: API responses were inconsistent — some returned bare objects, some returned `{ message }`, some returned arrays directly. This makes frontend pagination, caching, and error handling brittle.  
**Decision**: All API responses use `{ success: bool, data: any, meta?: {} }` via the `responseEnvelope.js` utility.  
**Consequences**: Frontend must unwrap `response.data` instead of using the raw response directly. Admin dashboard updated to handle both envelope and legacy formats during transition.

---

## ADR-006: Kafka → Redis Streams Migration

**Date**: 2026-04-24  
**Status**: Accepted  
**Context**: ADR-004 proposed Kafka for event-driven messaging. However, Kafka adds significant operational complexity (ZooKeeper, brokers, partition management) for a research platform that doesn't need millions of messages/sec throughput. Redis is already deployed for caching, rate limiting, and OTP sessions.  
**Decision**: Replace all Kafka references with Redis Streams (XADD/XREADGROUP) for durable event logs and Redis Pub/Sub for real-time non-durable events.
- Rename `kafkaEmitter.js` → `redisStreamEmitter.js`
- Use `ioredis` (already installed) for both Streams and Pub/Sub
- Consumer groups via XREADGROUP for durable processing
- 10 stream topics defined (see project-overview.txt Section Eight)
**Consequences**: One fewer Docker service. Simpler ops. Sufficient throughput for research platform scale. All imports referencing `kafkaEmitter` must be updated.