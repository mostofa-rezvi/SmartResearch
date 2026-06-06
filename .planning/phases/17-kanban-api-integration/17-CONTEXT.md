# Phase 17: Kanban API Integration - Context

**Gathered:** 2026-06-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the frontend `kanban-board.tsx` component to the backend `ProjectService` REST API, replacing static mock arrays with dynamic database-backed milestones, and persisting status changes (drag-and-drop actions) in compliance with the backend Milestone FSM rules.
</domain>

<decisions>
## Implementation Decisions

### 1. Kanban Card Entity Mapping
- **Decision:** Map board cards directly to the `milestones` table in PostgreSQL. The four Kanban columns ("To Do", "In Progress", "Review", "Done") align exactly with the milestone statuses (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`). The `tasks` table in the database will be treated as sub-tasks of milestones.

### 2. Frontend Data Fetching Strategy
- **Decision:** Use `SWR` hooks to fetch and manage milestone states. SWR provides built-in caching, revalidation, and supports clean optimistic UI updates.

### 3. Drag-and-Drop Mutation & Optimistic Updates
- **Decision:** Implement optimistic updates when dragging cards between columns. The frontend will instantly move the card locally, trigger the status update PATCH API request to the backend, and roll back to the original state if the API request fails (e.g., due to unauthorized transition or network failure).

### 4. Loading States / Skeletons
- **Decision:** Create and render modern loading skeleton cards inside columns during the initial data loading phase to maintain visual continuity and standard-compliant premium aesthetics.

### 5. Backend Endpoint Setup & Router Mounting
- **Decision:**
  - Create a new project router file `backend/src/routes/projects.js` and mount it under `/api/v1/projects` in `backend/src/index.js`.
  - Expose the following endpoints:
    - `POST /api/v1/projects`: Create project (wires to `ProjectController.create`).
    - `GET /api/v1/projects/:id`: Get project details (wires to `ProjectController.get`).
    - `GET /api/v1/projects/:id/milestones`: List all milestones for a project.
    - `POST /api/v1/projects/:id/milestones`: Create a new milestone (wires to `MilestoneService.createMilestone`).
    - `PATCH /api/v1/projects/milestones/:milestoneId/status`: Update milestone status (wires to `ProjectController.updateMilestone`).
  - Integrate standard authentication (`verifyAuth`) and validate role constraints on all routes.

### 6. RBAC & FSM Transition Constraints
- **Decision:** Enforce the FSM transition rules defined in `MilestoneService.js`:
  - `TODO` -> `IN_PROGRESS`
  - `IN_PROGRESS` -> `TODO`, `REVIEW`
  - `REVIEW` -> `IN_PROGRESS`, `DONE`
  - `DONE` -> `REVIEW`
  - Transition to `DONE` requires the user to have the `admin` role in the project. Non-admin members will see the card snap back (optimistic rollback) if they attempt to move cards directly to "Done".
</decisions>

<canonical_refs>
## Canonical References

- Database Schema: [collaboration_tables.sql](file:///d:/github/SmartResearch/backend/migrations/collaboration_tables.sql)
- Milestone Service & FSM logic: [MilestoneService.js](file:///d:/github/SmartResearch/backend/src/services/MilestoneService.js)
- Project Controller: [ProjectController.js](file:///d:/github/SmartResearch/backend/src/controllers/ProjectController.js)
</canonical_refs>

<specifics>
## Specific Ideas

No specific layout exceptions. The existing design aesthetics (glassmorphism, smooth CSS transitions, dark mode support) of `kanban-board.tsx` must be preserved.
</specifics>

<code_context>
## Existing Code Insights

### Integration Points
- Frontend Component: [kanban-board.tsx](file:///d:/github/SmartResearch/frontend/src/components/kanban-board.tsx)
- Frontend Workspace Dashboard: [page.tsx](file:///d:/github/SmartResearch/frontend/src/app/workspace/page.tsx)
- Backend Router Config: [index.js](file:///d:/github/SmartResearch/backend/src/index.js)
</code_context>

<deferred>
## Deferred Ideas

None — discussion focused entirely on core API integration.
</deferred>

---

*Phase: 17-kanban-api-integration*
*Context gathered: 2026-06-06*
