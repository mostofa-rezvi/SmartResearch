# Milestone v1.5 — Project Summary

**Generated:** 2026-06-07
**Purpose:** Team onboarding and project review

---

## 1. Project Overview

ResearchBridge is a Smart Research Collaboration Platform designed to facilitate academic and industrial research through advanced discovery, trust modeling, and real-time collaboration. It provides a unified ecosystem for researchers to share papers, form groups, and discover insights using a multi-database architecture.

Milestone v1.5 focused on low-priority hardening and security tasks:
- **WebSocket Security**: Implementing JWT authentication handshakes on Socket.IO connections and room authorization checks.
- **ML Calibration**: Empirically evaluating and calibrating the similarity threshold for the SBERT recommendation service to prevent irrelevant recommendations.

All target features for this milestone have been successfully delivered and verified.

## 2. Architecture & Technical Decisions

The following architectural choices and technical decisions were implemented during this milestone:

- **Decision:** Consolidate WebSocket authentication during the connection handshake.
  - **Why:** Replaces passing JWTs via URL query parameters (which can be logged by proxies) with the Socket.IO `auth` payload (`socket.io({ auth: { token } })`), with fallback to `x-auth-token` headers.
  - **Phase:** Phase 21
- **Decision:** Token verification on connection & room-join only.
  - **Why:** Avoids periodic check overhead on long-lived connections, checking only when the user initially connects or attempts to join a restricted room.
  - **Phase:** Phase 21
- **Decision:** Non-blocking authorization failure.
  - **Why:** On restricted room join failure, an `error` event is emitted to the client, but the socket is kept connected. This prevents disconnecting the user entirely and allows other non-restricted operations to continue.
  - **Phase:** Phase 21
- **Decision:** Empirically Calibrated SBERT Recommendation Threshold (`0.5332`).
  - **Why:** Selected using a deterministic script that analyzes co-membership rates (85% co-member pair retention) vs random noise (5% false positive rate).
  - **Phase:** Phase 21
- **Decision:** Popularity-Based Cold-Start Fallback.
  - **Why:** Pads recommendation lists using top popular researchers from the PostgreSQL database if too few SBERT results pass the strict similarity threshold cutoff.
  - **Phase:** Phase 21

## 3. Phases Delivered

| Phase | Name | Status | One-Liner |
|-------|------|--------|-----------|
| 21 | Security & ML Hardening | Complete | Implemented Socket.IO JWT authentication middleware and project membership room guards, calibrated SBERT recommendation threshold, and added popularity cold-start fallback. |

## 4. Requirements Coverage

- ✅ **HARD-SEC-01**: Secure Socket.IO WS routes using JWT handshake authentication.
- ✅ **HARD-ML-02**: Calibrate FastAPI SBERT recommendation threshold with empirical evaluation.

**Audit Status:** Passed. The milestone audit report is located at [.planning/v1.5-MILESTONE-AUDIT.md](file:///d:/github/SmartResearch/.planning/v1.5-MILESTONE-AUDIT.md).

## 5. Key Decisions Log

- **D-01: Token Transport via Auth Payload**
  - **Description:** Use auth payload (`socket.io({ auth: { token } })`) for sending the JWT during the Socket.IO connection handshake.
  - **Phase:** Phase 21
  - **Rationale:** Standardizes credential transport for websockets and avoids passing JWTs via URL query params.
- **D-02: Initial Connection & Room-Join Validation**
  - **Description:** Check token validity only on initial connection and room join.
  - **Phase:** Phase 21
  - **Rationale:** Minimizes unnecessary database and CPU overhead during long-lived websocket sessions.
- **D-03: Keep Socket Open on Room Join Failure**
  - **Description:** Emit an `error` event but keep the socket connected on room authorization failure.
  - **Phase:** Phase 21
  - **Rationale:** Prevents UX degradation by allowing other non-restricted operations to continue.
- **D-04: SBERT Cutoff Threshold of 0.5332**
  - **Description:** Enforce recommendation similarity threshold cutoff at `0.5332`.
  - **Phase:** Phase 21
  - **Rationale:** Retains 85% of known collaborative pairs (from Postgres project members) while filtering out 95% of random noise.

## 6. Tech Debt & Deferred Items

- **Yjs Client Integration Gap**: The Yjs client provider (`SocketIOProvider` in frontend) must be updated to pass the JWT token in the `auth.token` handshake field when connecting.
- **Nyquist Validation Gap**: Nyquist compliance scanning is missing for Phase 21. Action required: Run `/gsd-validate-phase 21` to establish validation specifications.

## 7. Getting Started

### Run the project
- **Backend API**: Navigate to `backend/` and run `npm run dev`.
- **FastAPI ML Service**: Navigate to `ml-service/` and start via Docker (`docker-compose up rb-ml`).

### Key Directories
- `backend/src/middleware/auth.js`: WebSocket connection authentication middleware.
- `backend/src/index.js`: Socket connection and room registration.
- `ml-service/main.py`: SBERT embedding calculations, recommendation endpoint, filtering, and database fallback.
- `ml-service/scripts/calibrate.py`: SBERT threshold calibration script.

### Tests
- **Backend Socket Security**: `npm test src/tests/socket.test.js`
- **FastAPI ML Recommendations**: `pytest ml-service/tests/test_api_recommendations.py`

---

## Stats

- **Timeline:** 2026-06-06 → 2026-06-07 (2 days)
- **Phases:** 1 / 1
- **Commits:** 6
- **Files changed:** 26 (+1166 insertions, -58 deletions)
- **Contributors:** Mostofa Rezvi
