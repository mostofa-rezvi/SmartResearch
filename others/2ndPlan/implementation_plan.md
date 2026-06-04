# ResearchBridge — Gap Closure Implementation Plan
**Student:** Mostofa Aminur Rashid (Roll: 2506107)
**Goal:** Close all 5 outstanding gaps from the Gaps & Outstanding Work section of the project status report using the GSD AI development system.

---

## Overview of What We're Closing

From `project_status_report.md`, the **Gaps & Outstanding Work** section has:

| Priority | Gap | Est. Effort |
|----------|-----|-------------|
| 🔴 High | WS/Yjs Connection in Editor UI | 1 day |
| 🔴 High | Workspace Kanban Dashboard Integration | 1 day |
| 🔴 High | Checklist & Templates Storage | Half day |
| 🟡 Medium | Mentorship Module (DB + API + UI) | 1–1.5 days |
| 🟡 Medium | Paper Tracking & Reading History | Half day |
| 🟢 Low | WebSocket Security Hardening | Half day |
| 🟢 Low | SBERT Threshold Calibration | Half day |

---

## Model Assignment Strategy

Following the **model-mapping.md** legend in `.agent/`:

| Tier | Model | Cost | Role |
|------|-------|------|------|
| 🔴 | **Gemini 3.1 Pro HIGH** | $$$ | Architecture, security, ML/algorithm design |
| 🟡 | **Gemini 3.1 Pro LOW** | $$ | Plan, execute, review, test |
| 🟢 | **Gemini Flash** | $ | Discuss (auto), milestones, audits, housekeeping |

> [!IMPORTANT]
> You switch models **between commands, not mid-command**. Each command below specifies which model to use **before running it**.

---

## Phase A — 🔴 High Priority Gap Closure (3 Tasks)

> [!NOTE]
> This phase delivers the **crown jewel demo features**: real-time Yjs collaboration + live Kanban. Do these first for maximum thesis defense impact.

### A.0 — Bootstrap New Milestone (Gemini Flash)

**Step 1** → Switch to **Gemini Flash**
```
/gsd-new-milestone
```
> Context to paste: "Starting Gap Closure Milestone. Three high-priority gaps: (1) WS/Yjs Editor UI, (2) Kanban API Integration, (3) Template files. Backend already implemented — wiring frontend only."

---

### A.1 — Yjs/WebSocket Collaborative Editor Integration

This is the most impactful gap. The `CollaborationService` + Yjs backend is 100% done. You only need to wire `@hocuspocus/provider` or `y-websocket` into `collaborative-editor.tsx`.

**Step 2** → Switch to **Gemini 3.1 Pro HIGH**
```
/gsd-discuss-phase
```
> Context: "I need to integrate Yjs real-time collaboration into collaborative-editor.tsx. Backend uses Hocuspocus (Node.js). Existing code is a mock textarea. I need to decide between @hocuspocus/provider vs y-websocket client, handle awareness cursors, and connect to the existing WS gateway."

**Step 3** → Stay on **Gemini 3.1 Pro HIGH**
```
/gsd-plan-phase
```
> Context from Step 2 output. This designs the exact React hook, provider setup, awareness/cursor display, and reconnection logic.

**Step 4** → Switch to **Gemini 3.1 Pro LOW**
```
/gsd-execute-phase
```
> Execute the plan. Produces the wired `collaborative-editor.tsx` with real Yjs sync.

**Step 5** → Stay on **Gemini 3.1 Pro LOW**
```
/gsd-code-review
```
> Review: race conditions, reconnection edge cases, memory leaks from Yjs doc not being cleaned up.

---

### A.2 — Kanban Board API Integration

**Step 6** → Switch to **Gemini Flash**
```
/gsd-discuss-phase --auto
```
> Context: "Kanban Board (kanban-board.tsx) uses hardcoded data. Need to wire ProjectService API endpoints: GET /projects, GET /projects/:id/board, PATCH /tasks/:id (for drag-drop status). Milestone state machine on backend is complete."

**Step 7** → Switch to **Gemini 3.1 Pro LOW**
```
/gsd-plan-phase
```
> Plan: SWR/React Query hooks for fetching, optimistic update on drag-drop, error toast, loading skeletons.

**Step 8** → Stay on **Gemini 3.1 Pro LOW**
```
/gsd-execute-phase
```

**Step 9** → Stay on **Gemini 3.1 Pro LOW**
```
/gsd-ui-review
```
> 6-pillar visual audit of the wired Kanban board.

---

### A.3 — Template Files (Quick Win)

**Step 10** → Switch to **Gemini Flash**
```
/gsd-fast
```
> Task: "Create `frontend/public/templates/` directory. Add placeholder files: `ieee.docx`, `apa.docx`, `nature.docx`, `acm.docx`. Each should be a minimal valid Word doc with the journal's basic template structure. Update any template download links in the UI to point to `/templates/filename.docx`."

---

### A.4 — High Priority Verification

**Step 11** → Switch to **Gemini 3.1 Pro LOW**
```
/gsd-verify-work
```
> UAT: (1) Open editor → see real cursor from two browser tabs syncing. (2) Open workspace → Kanban shows real project data from DB. (3) Click template download → file downloads (not 404).

**Step 12** → Switch to **Gemini Flash**
```
/gsd-audit-uat
```

**Step 13** → Stay on **Gemini Flash**
```
/gsd-audit-milestone
```

---

## Phase B — 🟡 Medium Priority Gap Closure (2 Tasks)

> [!NOTE]
> Mentorship Module is **0% done** — requires DB schema, backend API, and frontend UI. Paper Tracking is a simpler add-on to existing user profile.

### B.0 — New Milestone (Gemini Flash)

**Step 14** → Switch to **Gemini Flash**
```
/gsd-new-milestone
```
> Context: "Medium priority gaps: Mentorship Module (DB + API + UI) and Paper Reading History tracking."

---

### B.1 — Mentorship Module

**Step 15** → Switch to **Gemini Flash**
```
/gsd-discuss-phase --auto
```
> Context: "Mentorship module is 0% done. Proposal requires: slot creation, CF+CB pairing, session tracking. Pragmatic approach: single `mentorships` table (mentor_id, mentee_id, status: pending/accepted/rejected, message, created_at). Express POST /mentorship/request, GET /mentorship/my, PATCH /mentorship/:id/respond. Simple React request form + inbox UI."

**Step 16** → Switch to **Gemini 3.1 Pro LOW**
```
/gsd-plan-phase
```
> Plan: Full DB migration SQL, Express router + controller, React components (RequestForm, MentorshipInbox).

**Step 17** → Stay on **Gemini 3.1 Pro LOW**
```
/gsd-execute-phase
```
> Implement: migration file, controller, routes, Neo4j MENTORS edge creation (triggers event on accept), and React UI.

**Step 18** → Stay on **Gemini 3.1 Pro LOW**
```
/gsd-code-review
```

**Step 19** → Stay on **Gemini 3.1 Pro LOW**
```
/gsd-add-tests
```
> Unit tests for mentorship controller (request creation, status transitions, authorization).

---

### B.2 — Paper Tracking & Reading History

**Step 20** → Switch to **Gemini Flash**
```
/gsd-fast
```
> Task: "Add `reading_history` table: (user_id FK, paper_id, read_at, action: view/bookmark/download). Add Express GET /users/me/history. Wire dashboard 'Papers Read' count to this endpoint instead of hardcoded 0. Track reads on paper view events."

---

### B.3 — Medium Priority Verification

**Step 21** → Switch to **Gemini 3.1 Pro LOW**
```
/gsd-verify-work
```
> UAT: (1) Request mentorship as Student, accept as Mentor → neo4j MENTORS edge created. (2) View a paper → dashboard count increments.

**Step 22** → Switch to **Gemini Flash**
```
/gsd-audit-milestone
```

---

## Phase C — 🟢 Low Priority Gap Closure (2 Tasks)

> [!NOTE]
> These are hardening tasks — important for production quality and thesis completeness but not blocking the demo.

### C.0 — New Milestone (Gemini Flash)

**Step 23** → Switch to **Gemini Flash**
```
/gsd-new-milestone
```
> Context: "Low priority hardening: WebSocket JWT auth and SBERT threshold calibration."

---

### C.1 — WebSocket Security Hardening

**Step 24** → Switch to **Gemini 3.1 Pro HIGH**
```
/gsd-discuss-phase
```
> Context: "Socket.IO server needs JWT auth middleware. Goal: reject unauthenticated connections, verify user is a project member before joining room. Existing JWT utils are in auth middleware. Need to extract and apply in Socket.IO handshake."

**Step 25** → Stay on **Gemini 3.1 Pro HIGH**
```
/gsd-plan-phase
```
> Designs: Socket.IO `io.use()` JWT verification middleware, room-join guard checking project membership from PostgreSQL.

**Step 26** → Switch to **Gemini 3.1 Pro LOW**
```
/gsd-execute-phase
```

**Step 27** → Stay on **Gemini 3.1 Pro HIGH**
```
/gsd-secure-phase
```
> Security audit: token replay, missing auth on specific namespaces, room isolation bypass.

---

### C.2 — SBERT Threshold Calibration

**Step 28** → Switch to **Gemini 3.1 Pro HIGH**
```
/gsd-discuss-phase
```
> Context: "FastAPI ML service has recommendation score cutoff. Current threshold is uncalibrated. I have sample researcher profiles in the DB. Need to design an offline eval: run similarity on known good pairs vs random pairs, plot score distribution, pick cutoff at ~85th percentile of good pairs."

**Step 29** → Stay on **Gemini 3.1 Pro HIGH**
```
/gsd-plan-phase
```
> Plan: Python evaluation script, sample pair generation from DB, histogram plot, config update.

**Step 30** → Switch to **Gemini 3.1 Pro LOW**
```
/gsd-execute-phase
```

**Step 31** → Stay on **Gemini 3.1 Pro HIGH**
```
/gsd-eval-review
```
> Retroactively audit evaluation coverage: are cutoff scores tested? Is cold-start handled? Is the eval reproducible?

---

### C.3 — Low Priority Verification

**Step 32** → Switch to **Gemini 3.1 Pro LOW**
```
/gsd-verify-work
```
> UAT: (1) WebSocket connection without JWT → rejected. (2) SBERT recommendations use calibrated threshold (no obviously irrelevant matches at score > cutoff).

**Step 33** → Switch to **Gemini Flash**
```
/gsd-audit-milestone
```

---

## Phase D — 🚢 Ship & Finalize

**Step 34** → Switch to **Gemini Flash**
```
/gsd-extract_learnings
```

**Step 35** → Switch to **Gemini 3.1 Pro LOW**
```
/gsd-docs-update
```
> Update README with: Mentorship module, WebSocket auth note, how to run templates.

**Step 36** → Switch to **Gemini Flash**
```
/gsd-milestone-summary
```

**Step 37** → Switch to **Gemini 3.1 Pro LOW**
```
/gsd-ship
```

**Step 38** → Switch to **Gemini Flash**
```
/gsd-session-report
```

---

## Full Command Sequence at a Glance

```
PHASE A — HIGH PRIORITY
─────────────────────────────────────────────────────
[Flash]      /gsd-new-milestone            ← A.0
[Pro HIGH]   /gsd-discuss-phase            ← A.1 Yjs discuss
[Pro HIGH]   /gsd-plan-phase               ← A.1 Yjs plan
[Pro LOW]    /gsd-execute-phase            ← A.1 Yjs execute
[Pro LOW]    /gsd-code-review              ← A.1 Yjs review
[Flash]      /gsd-discuss-phase --auto     ← A.2 Kanban discuss
[Pro LOW]    /gsd-plan-phase               ← A.2 Kanban plan
[Pro LOW]    /gsd-execute-phase            ← A.2 Kanban execute
[Pro LOW]    /gsd-ui-review                ← A.2 Kanban UI audit
[Flash]      /gsd-fast                     ← A.3 Templates
[Pro LOW]    /gsd-verify-work              ← A.4 UAT
[Flash]      /gsd-audit-uat                ← A.4 audit
[Flash]      /gsd-audit-milestone          ← A.4 milestone check

PHASE B — MEDIUM PRIORITY
─────────────────────────────────────────────────────
[Flash]      /gsd-new-milestone            ← B.0
[Flash]      /gsd-discuss-phase --auto     ← B.1 Mentorship discuss
[Pro LOW]    /gsd-plan-phase               ← B.1 Mentorship plan
[Pro LOW]    /gsd-execute-phase            ← B.1 Mentorship execute
[Pro LOW]    /gsd-code-review              ← B.1 Mentorship review
[Pro LOW]    /gsd-add-tests                ← B.1 Mentorship tests
[Flash]      /gsd-fast                     ← B.2 Paper history
[Pro LOW]    /gsd-verify-work              ← B.3 UAT
[Flash]      /gsd-audit-milestone          ← B.3 milestone check

PHASE C — LOW PRIORITY
─────────────────────────────────────────────────────
[Flash]      /gsd-new-milestone            ← C.0
[Pro HIGH]   /gsd-discuss-phase            ← C.1 WS security discuss
[Pro HIGH]   /gsd-plan-phase               ← C.1 WS security plan
[Pro LOW]    /gsd-execute-phase            ← C.1 WS security execute
[Pro HIGH]   /gsd-secure-phase             ← C.1 security audit
[Pro HIGH]   /gsd-discuss-phase            ← C.2 SBERT discuss
[Pro HIGH]   /gsd-plan-phase               ← C.2 SBERT plan
[Pro LOW]    /gsd-execute-phase            ← C.2 SBERT execute
[Pro HIGH]   /gsd-eval-review              ← C.2 SBERT eval audit
[Pro LOW]    /gsd-verify-work              ← C.3 UAT
[Flash]      /gsd-audit-milestone          ← C.3 milestone check

PHASE D — SHIP
─────────────────────────────────────────────────────
[Flash]      /gsd-extract_learnings
[Pro LOW]    /gsd-docs-update
[Flash]      /gsd-milestone-summary
[Pro LOW]    /gsd-ship
[Flash]      /gsd-session-report
```

---

## Cost Breakdown (This Plan)

| Model | Commands | % |
|-------|----------|---|
| 🔴 Gemini 3.1 Pro HIGH | 9 | 24% |
| 🟡 Gemini 3.1 Pro LOW | 17 | 45% |
| 🟢 Gemini Flash | 12 | 31% |
| **Total** | **38** | 100% |

---

## Key Tips (From `.agent/model-mapping.md`)

> - Type `/gsd-*` commands directly in chat — they're recognized by the GSD skill system
> - Switch models **between commands**, not mid-command
> - Use `--auto` flag on `discuss-phase` to save Flash tokens (for non-architecture decisions)
> - Use `--chain` flag to auto-run `discuss → plan → execute` in one shot (use Pro Low for this)
> - The `.agent/skills/` files are AI reference docs — the AI reads them, you don't need to open them
> - Paste context from `.agent/commands/` files when running plan/execute commands to give the AI the right context

*ResearchBridge Gap Closure Plan · Mostofa Aminur Rashid · 2026*
