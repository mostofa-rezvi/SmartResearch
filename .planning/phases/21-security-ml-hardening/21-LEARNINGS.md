---
phase: 21
phase_name: "security-ml-hardening"
project: "ResearchBridge"
generated: "2026-06-07"
counts:
  decisions: 4
  lessons: 2
  patterns: 2
  surprises: 2
missing_artifacts:
  - "21-UAT.md"
---

# Phase 21 Learnings: Security & ML Hardening

## Decisions

### D-01: Token Transport via Auth Payload
Use auth payload (`socket.io({ auth: { token } })`) for sending the JWT during the Socket.IO connection handshake, with a fallback check on the `x-auth-token` header.

**Rationale:** Standardizes credential transport for websockets and avoids passing JWTs via URL query params which are logged.
**Source:** 21-CONTEXT.md

---

### D-02: Initial Connection & Room-Join Validation
Check token validity only on initial connection (handshake) and when joining project rooms. Do not run checks periodically while the socket is active.

**Rationale:** Minimizes unnecessary database and CPU overhead during long-lived websocket sessions.
**Source:** 21-CONTEXT.md

---

### D-03: Keep Socket Open on Room Join Failure
When an unauthorized user attempts to join a restricted project room, emit an `error` event but keep the socket connected.

**Rationale:** Prevents severe user experience degradation by allowing other non-restricted websocket operations to continue instead of terminating the socket.
**Source:** 21-CONTEXT.md

---

### D-04: SBERT Cutoff Threshold of 0.5332
Set the recommendation threshold cutoff at `0.5332` based on SBERT cosine similarity metrics.

**Rationale:** Keeping 85% (15th percentile) of known collaborative pairs (from Postgres project members) while filtering out 95% of random noise pairs.
**Source:** 21-PLAN.md

---

## Lessons

### Lesson: PowerShell Command Execution Differences
When executing test runs and scripts on Windows environments using shell executors, standard Bash chaining operations (like `&&`) fail. Semicolons or separate process invocations must be used.

**Context:** Local tests and calibration run execution during verification phases on Windows hosts.
**Source:** walkthrough.md

---

### Lesson: Container vs Local Package Differences
Local environment packages can diverge from fresh container builds. Even if packages are unpinned, fresh builds pulling from PyPI can download newer versions containing breaking API removals that do not manifest locally.

**Context:** Docker build failing with `huggingface_hub` package import errors while local tests pass.
**Source:** walkthrough.md

---

## Patterns

### Pattern: Empirical Cutoff Threshold Calibration
Connect to primary database, extract known good pairs (e.g. co-members on projects), generate a set of random negative pairs, calculate similarity scores, and locate the intersection percentile.

**When to use:** Tuning threshold constants for recommendation, search, or matching algorithms.
**Source:** 21-PLAN.md

---

### Pattern: Popularity Cold Start Fallback
When strict thresholding filters out too many candidates, fetch popular entities from the database (e.g., highly cited researchers) to pad the recommendation list to the desired length.

**When to use:** Maintaining UX consistency when recommendation lists have too few high-confidence items.
**Source:** 21-PLAN.md

---

## Surprises

### Surprise: UnboundLocalError in FastAPI main.py
FastAPI recommendations failed initially due to an `UnboundLocalError` from a misplaced local import of the `os` module inside the recommendation route handler.

**Impact:** Moved all imports to the global scope to ensure consistent module initialization.
**Source:** walkthrough.md

---

### Surprise: Hugging Face Hub version 0.26.0 Breaking Change
Rebuilding the FastAPI container downloaded the latest `huggingface_hub` package, which removed `cached_download` and caused `SentenceTransformer` imports to fail with an `ImportError`.

**Impact:** Had to pin `huggingface_hub<0.26.0` in `requirements.txt` to restore compatibility.
**Source:** walkthrough.md
