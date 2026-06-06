# ResearchBridge — Gap Closure Task Tracker

> Update this as you complete each step. Mark `[/]` when in progress, `[x]` when done.

---

## Phase A — 🔴 High Priority (Steps 1–13)

### A.0 — New Milestone
- [ ] **Step 1** `[Flash]` `/gsd-new-milestone` — "Gap Closure Milestone: Yjs Editor, Kanban API, Templates"

### A.1 — Yjs/WebSocket Collaborative Editor
- [x] **Step 2** `[Pro HIGH]` `/gsd-discuss-phase` — Yjs provider selection + awareness/cursor design
- [x] **Step 3** `[Pro HIGH]` `/gsd-plan-phase` — Exact React hook, provider setup, reconnection logic
- [x] **Step 4** `[Pro LOW]`  `/gsd-execute-phase` — Wire `collaborative-editor.tsx` with real Yjs sync
- [x] **Step 5** `[Pro LOW]`  `/gsd-code-review` — Race conditions, memory leaks, reconnection edge cases

### A.2 — Kanban Board API Integration
- [x] **Step 6** `[Flash]`    `/gsd-discuss-phase --auto` — Kanban wiring to ProjectService endpoints
- [x] **Step 7** `[Pro LOW]`  `/gsd-plan-phase` — SWR hooks, optimistic updates, loading skeletons
- [x] **Step 8** `[Pro LOW]`  `/gsd-execute-phase` — Wire kanban-board.tsx to live API
- [x] **Step 9** `[Pro LOW]`  `/gsd-ui-review` — 6-pillar visual audit

### A.3 — Template Files
- [x] **Step 10** `[Flash]`   `/gsd-fast` — Create `frontend/public/templates/` + seed ieee/apa/nature/acm files
 
### A.4 — High Priority Verification
- [x] **Step 11** `[Pro LOW]` `/gsd-verify-work` — UAT: Yjs sync, live Kanban, template download
- [x] **Step 12** `[Flash]`   `/gsd-audit-uat`
- [x] **Step 13** `[Flash]`   `/gsd-audit-milestone`

---

## Phase B — 🟡 Medium Priority (Steps 14–22)

### B.0 — New Milestone
- [ ] **Step 14** `[Flash]`   `/gsd-new-milestone` — "Medium Priority: Mentorship Module + Paper History"

### B.1 — Mentorship Module
- [x] **Step 15** `[Flash]`   `/gsd-discuss-phase --auto` — Simple mentorships table + request/accept flow
- [ ] **Step 16** `[Pro LOW]` `/gsd-plan-phase` — DB migration, Express routes, React UI components
- [ ] **Step 17** `[Pro LOW]` `/gsd-execute-phase` — Full Mentorship: DB + API + Neo4j edge + UI
- [ ] **Step 18** `[Pro LOW]` `/gsd-code-review`
- [ ] **Step 19** `[Pro LOW]` `/gsd-add-tests` — Controller tests: create request, accept/reject, auth guard

### B.2 — Paper Reading History
- [ ] **Step 20** `[Flash]`   `/gsd-fast` — `reading_history` table + GET /users/me/history + wire dashboard count

### B.3 — Medium Priority Verification
- [ ] **Step 21** `[Pro LOW]` `/gsd-verify-work` — UAT: mentorship flow, Neo4j edge, dashboard count
- [ ] **Step 22** `[Flash]`   `/gsd-audit-milestone`

---

## Phase C — 🟢 Low Priority (Steps 23–33)

### C.0 — New Milestone
- [ ] **Step 23** `[Flash]`   `/gsd-new-milestone` — "Hardening: WebSocket Security + SBERT Calibration"

### C.1 — WebSocket Security Hardening
- [ ] **Step 24** `[Pro HIGH]` `/gsd-discuss-phase` — JWT middleware in Socket.IO handshake, room join guard
- [ ] **Step 25** `[Pro HIGH]` `/gsd-plan-phase` — `io.use()` JWT verify + project membership DB check
- [ ] **Step 26** `[Pro LOW]`  `/gsd-execute-phase` — Implement Socket.IO auth middleware
- [ ] **Step 27** `[Pro HIGH]` `/gsd-secure-phase` — Audit: token replay, namespace bypass, room isolation

### C.2 — SBERT Threshold Calibration
- [ ] **Step 28** `[Pro HIGH]` `/gsd-discuss-phase` — Offline eval design: known pairs vs random, score distribution
- [ ] **Step 29** `[Pro HIGH]` `/gsd-plan-phase` — Python eval script, histogram, cutoff selection
- [ ] **Step 30** `[Pro LOW]`  `/gsd-execute-phase` — Run eval, update FastAPI config with calibrated threshold
- [ ] **Step 31** `[Pro HIGH]` `/gsd-eval-review` — Audit eval coverage: cold-start, reproducibility

### C.3 — Low Priority Verification
- [ ] **Step 32** `[Pro LOW]`  `/gsd-verify-work` — UAT: WS rejects no-JWT, SBERT matches are relevant
- [ ] **Step 33** `[Flash]`    `/gsd-audit-milestone`

---

## Phase D — 🚢 Ship (Steps 34–38)

- [ ] **Step 34** `[Flash]`    `/gsd-extract_learnings`
- [ ] **Step 35** `[Pro LOW]`  `/gsd-docs-update` — README: Mentorship, WS auth, template setup
- [ ] **Step 36** `[Flash]`    `/gsd-milestone-summary`
- [ ] **Step 37** `[Pro LOW]`  `/gsd-ship` — PR + review + merge
- [ ] **Step 38** `[Flash]`    `/gsd-session-report`

---

## Progress Summary

| Phase | Done | Total | % |
|-------|------|-------|---|
| A — High Priority | 12 | 13 | 92% |
| B — Medium Priority | 0 | 9 | 0% |
| C — Low Priority | 0 | 11 | 0% |
| D — Ship | 0 | 5 | 0% |
| **TOTAL** | **12** | **38** | **32%** |
