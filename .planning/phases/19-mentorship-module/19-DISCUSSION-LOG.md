# Phase 19: Mentorship Module - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-06
**Phase:** 19-mentorship-module
**Areas discussed:** Database Schema, API Routing, UI Components, Graph Sync

---

## Database Schema

| Option | Description | Selected |
|--------|-------------|----------|
| Single Table | Pragmatic mentorships table storing IDs, status, message, and timestamp | ✓ |
| Multi-Table Slots | Separate slots, bookings, and reviews tables (high complexity) | |

**User's choice:** Single Table (Recommended default for pragmatic scope)
**Notes:** User specifically requested a single mentorships table.

---

## API Routing

| Option | Description | Selected |
|--------|-------------|----------|
| Express REST Router | POST /request, GET /my, PATCH /:id/respond routes | ✓ |
| GraphQL Queries | Query/Mutation integration (out of phase scope) | |

**User's choice:** Express REST Router
**Notes:** Handled in backend services.

---

## UI Components

| Option | Description | Selected |
|--------|-------------|----------|
| RequestForm + Inbox UI | Integrated form on profiles and inbox list on dashboard | ✓ |
| Calendar/Schedule View | Interactive timeslots select UI (deferred) | |

**User's choice:** RequestForm + Inbox UI

---

## Graph Sync

| Option | Description | Selected |
|--------|-------------|----------|
| Neo4j Edge Creation | Sync MENTORS edge on accept | ✓ |
| No Graph Sync | Database tracking only | |

**User's choice:** Neo4j Edge Creation
