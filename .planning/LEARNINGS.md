# Project Learnings — SmartResearch

## Executive Summary
The 3-week build of SmartResearch has evolved from a feature-focused research assistant into a secure, scalable social platform for academics. Key takeaways include the importance of early security audits in "trust-based" systems and the necessity of actual evaluation frameworks for AI-driven features.

## Decisions & Rationale

### 1. Unified Auth & TrustRank
- **Decision:** Consolidate TrustRank calculation on the server-side, strictly decoupled from frontend requests.
- **Rationale:** Initial Phase 14 implementation allowed frontend-defined TrustRank, creating a critical spoofing vulnerability. Security audit (Phase 15) forced a refactor to a source-of-truth lookup.

### 2. Infrastructure-as-Code (IaC) Early
- **Decision:** Implement K8s manifests and HPA before the final production milestone.
- **Rationale:** Load testing targets (10k concurrent users) required early validation of scaling behaviors, particularly for the resource-heavy SBERT ML service.

### 3. Evaluation-First AI
- **Decision:** Retroactively audit AI features against an evaluation coverage spec (Phase 14 EVAL-REVIEW).
- **Rationale:** Discovered that rule-based "spam filters" were insufficient for nuanced research discourse. Future AI features now require a labeled reference dataset and LLM-judge calibration before implementation.

## Patterns Discovered

### "Trust-Gating" Pattern
Using a user's reputation (TrustRank) as a gate for moderation and feed ranking. 
- **Learning:** This pattern requires strict server-side integrity. Any client-side participation in the rank value is a security failure.

### "Wave-Based Execution"
Grouping infrastructure and testing into dependency-aware waves.
- **Learning:** Wave 1 (Manifests) -> Wave 2 (Load tests) -> Wave 3 (Alerts) ensured that benchmarks were running against valid infrastructure, reducing debug cycles.

## Surprises & Pitfalls

### The "Heuristic Trap"
- **Surprise:** How easily trivial heuristics (keyword matching) can be mistaken for "AI features" during the planning phase.
- **Pitfall:** Phase 14 initially lacked a proper AI specification, leading to a low evaluation score (15/100) until the audit-fix pipeline was applied.

### predictable ID Enumeration
- **Surprise:** The persistence of `Math.random()` in boilerplate code.
- **Pitfall:** A simple security scan revealed that thread IDs were collision-prone and enumerable, requiring a global switch to `crypto.randomUUID()`.

## Recommendations for Future Milestones
1. **DB Migration:** Transition from in-memory mocks to a persistent PostgreSQL schema immediately.
2. **Continuous E2E:** Integrate the Playwright suite into a GitHub Action to prevent regression in the hardened auth logic.
3. **ML Service Isolation:** Use K8s NetworkPolicies to ensure the ML service is only reachable by the backend API.
