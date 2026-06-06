# Phase 17: Kanban API Integration - Plan

**Wave:** 1-3 | **Tasks:** 8 | **Autonomous:** true

<planning_context>
Phase 17 focuses on integrating the frontend Kanban board with the backend ProjectService and MilestoneService APIs, including support for SWR data fetching, optimistic UI updates, error toasts, and skeleton loaders.
Requirements: KANBAN-01, KANBAN-02, KANBAN-03.
Context: 17-CONTEXT.md.
</planning_context>

## Wave 1: Backend Routing & Controller Mount

### Task 1.1: Create Project Router
- **Action**: Create `backend/src/routes/projects.js`. Implement the following routes with `verifyAuth` middleware:
  - `POST /` (calls `ProjectController.create`)
  - `GET /:id` (calls `ProjectController.get`)
  - `GET /:id/milestones` (queries database to select all milestones for `project_id = :id`)
  - `POST /:id/milestones` (calls `MilestoneService.createMilestone` with `projectId = :id`, title, and description from body)
  - `PATCH /milestones/:milestoneId/status` (calls `ProjectController.updateMilestone` which uses `MilestoneService.updateStatus`)
- **Read First**: [ProjectController.js](file:///d:/github/SmartResearch/backend/src/controllers/ProjectController.js), [MilestoneService.js](file:///d:/github/SmartResearch/backend/src/services/MilestoneService.js), [groups.js](file:///d:/github/SmartResearch/backend/src/routes/groups.js)
- **Acceptance Criteria**: `backend/src/routes/projects.js` exists, contains standard route declarations using Express Router, and exports the router.
- **Autonomous**: true

### Task 1.2: Register Project Router
- **Action**: Modify `backend/src/index.js` to import and mount the projects router under `/api/v1/projects` (and `/api/projects` for backward compatibility).
- **Read First**: [index.js](file:///d:/github/SmartResearch/backend/src/index.js)
- **Acceptance Criteria**: `index.js` registers the router via `app.use('/api/v1/projects', require('./routes/projects'))` and `app.use('/api/projects', require('./routes/projects'))`.
- **Autonomous**: true

### Task 1.3: Backend Integration Test
- **Action**: Create `backend/tests/routes/projects.test.js` to test routing and role validations:
  - Verify that a GET to `/api/v1/projects/:id` returns 401/403 for unauthenticated/unauthorized users.
  - Verify that a PATCH to `/api/v1/projects/milestones/:milestoneId/status` validates the Milestone FSM transitions and returns 400 for invalid transitions, and restricts transition to `DONE` to admins.
- **Read First**: [MilestoneService.test.js](file:///d:/github/SmartResearch/backend/tests/services/MilestoneService.test.js)
- **Acceptance Criteria**: Running tests via `npm test` or a custom jest command executes successfully and tests the FSM states and role blocks.
- **Autonomous**: true

## Wave 2: Frontend API Configurations & Hooks

### Task 2.1: Register Endpoints in Frontend API Config
- **Action**: Modify `frontend/src/config/api.ts` to add a `projects` section under the central `API` constant:
  - `listMilestones: (projectId: string) => string` mapping to `${API_BASE}/api/v1/projects/${projectId}/milestones`
  - `createMilestone: (projectId: string) => string` mapping to `${API_BASE}/api/v1/projects/${projectId}/milestones`
  - `updateMilestoneStatus: (milestoneId: string) => string` mapping to `${API_BASE}/api/v1/projects/milestones/${milestoneId}/status`
- **Read First**: [api.ts](file:///d:/github/SmartResearch/frontend/src/config/api.ts)
- **Acceptance Criteria**: `frontend/src/config/api.ts` compiles and contains the projects endpoint mapping.
- **Autonomous**: true

### Task 2.2: Create SWR Hook for Kanban Milestones
- **Action**: Install `swr` in the frontend if missing. Create `frontend/src/hooks/useProjectMilestones.ts`. This hook will:
  - Fetch milestones using `useSWR(projectId ? API.projects.listMilestones(projectId) : null, fetcher)`.
  - Expose a `mutateMilestoneStatus` function that performs an optimistic update using SWR's `mutate` API: locally swaps columns/states of the card immediately, fires the `PATCH` API request, and rolls back if the PATCH fails.
- **Read First**: [YjsProvider.tsx](file:///d:/github/SmartResearch/frontend/src/context/YjsProvider.tsx)
- **Acceptance Criteria**: `useProjectMilestones.ts` exists, correctly defines SWR options for revalidation, and exports `useProjectMilestones` hook with `milestones`, `loading`, `error`, and `mutateMilestoneStatus`.
- **Autonomous**: true

## Wave 3: UI Component Wiring & Drag-and-Drop

### Task 3.1: Integrate SWR Hook into Kanban Board
- **Action**: Modify `frontend/src/components/kanban-board.tsx` to:
  - Call `useProjectMilestones` hook with a dynamic or default project ID (e.g. `1` or passed via props).
  - Map milestones to columns (`todo`, `in-progress`, `review`, `done`) based on their `status`.
  - Add drag-and-drop mechanics or handle standard HTML5 drag-and-drop to update statuses.
  - On dropping a card, trigger `mutateMilestoneStatus` optimistically. If an error is caught (e.g. FSM restriction or non-admin DONE restriction), trigger a temporary Toast notification with the error message.
- **Read First**: [kanban-board.tsx](file:///d:/github/SmartResearch/frontend/src/components/kanban-board.tsx), [page.tsx](file:///d:/github/SmartResearch/frontend/src/app/workspace/page.tsx)
- **Acceptance Criteria**: The Kanban board loads dynamic card titles, allows moving cards, and displays an animated error toast at the bottom of the page if a move fails.
- **Autonomous**: true

### Task 3.2: Implement Skeleton Loaders
- **Action**: Add a loading state skeleton UI in `kanban-board.tsx`. If `loading` from the hook is true, render a series of animated grey skeleton boxes in place of the tasks to keep page layout stable and look premium.
- **Read First**: [kanban-board.tsx](file:///d:/github/SmartResearch/frontend/src/components/kanban-board.tsx)
- **Acceptance Criteria**: Columns show animated pulse skeletons before data fetching finishes.
- **Autonomous**: true

### Task 3.3: Workspace Dashboard Integration
- **Action**: Modify `frontend/src/app/workspace/page.tsx` to provide the default project ID `1` to `<KanbanBoard />`. If the project name is hardcoded, fetch the project details from `/api/v1/projects/1` and render the dynamic project name "Quantum ML Integrations" (or whatever name is returned).
- **Read First**: [page.tsx](file:///d:/github/SmartResearch/frontend/src/app/workspace/page.tsx)
- **Acceptance Criteria**: The workspace dashboard displays the project name dynamically and passes the project ID to the Kanban board.
- **Autonomous**: true

## Verification Criteria

- [ ] Project router mounted successfully on the backend and validated with unit/integration tests.
- [ ] Milestone API endpoints function correctly with FSM validation rules.
- [ ] Frontend SWR hook retrieves real milestones and handles cache updates.
- [ ] Kanban Board is wired to SWR, displaying dynamic cards and loading skeletons.
- [ ] Drag-and-drop reordering performs optimistic updates and shows error toast on failure.

## must_haves

- [ ] Backend FSM rules strictly enforced via `MilestoneService.updateStatus`.
- [ ] SWR optimistic update rolls back card positions immediately when status transition is rejected by server.
- [ ] UI is not blocked while API request is in progress.
- [ ] Visual styling remains harmonious and complies with premium aesthetics guidelines (smooth CSS/framer-motion animations).
