# VERIFICATION — Phase 10: Collaboration Workspace Backend

## UAT Criteria

### 1. Project Management
- **Scenario**: Create a project and add two researchers.
- **Expectation**: Members are correctly associated and can be listed via the API.

### 2. Milestone State Machine
- **Scenario**: A Researcher attempts to move a milestone from `REVIEW` to `DONE`.
- **Expectation**: Request rejected (Only Admin can finalize). Transition from `TODO` to `IN_PROGRESS` should succeed.

### 3. Real-Time Presence
- **Scenario**: User A and User B join Project Room 1.
- **Expectation**: User A receives a "joined" event for User B. User B sees User A in the presence list.

### 4. Collaborative Sync (Yjs)
- **Scenario**: User A sends a document update. Server restarts. User B joins.
- **Expectation**: User B receives the merged document state from Postgres.

## Status: ⏳ PENDING
Verification will begin after Plan 10-02 is executed.
