# CONTEXT — Phase 10: Collaboration Workspace Backend

## Phase Objective
Implement the foundational backend for real-time researcher collaboration, including project management, milestone tracking, and CRDT-based document synchronization.

## Locked Decisions

### 1. Project Management (PostgreSQL)
- **Projects**: Acts as the root container.
- **Milestones**: Uses a Finite State Machine for tracking progress.
- **Task Assignment**: Link tasks to researchers with status tracking.

### 2. Real-Time Sync (Yjs + Socket.IO)
- **CRDT**: Use Yjs to handle concurrent document editing.
- **Sync Protocol**: Custom Socket.IO event handler (`sync:update`) that passes binary update chunks.
- **Persistence**: Store the current document state as a `BYTEA` blob in the `collaborative_docs` table.
- **Efficiency**: Only write to Postgres every 5 seconds (debounce) or when the room is empty, to prevent DB thrashing.

### 3. Presence Logic
- **Room naming**: `project:{projectId}`.
- **States**: `online`, `editing:{docId}`, `away`.
- **Broadcast**: On join/leave, broadcast the list of active user objects to all room members.

### 4. Milestone State Machine
- **Statuses**: `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`.
- **Rules**:
    - Only Admins can move to `DONE`.
    - `DONE` items cannot be moved back to `TODO` without a comment log.

## Integration Pattern
- **Backend (Node.js)**: Orchestrates Socket.IO and Postgres.
- **Persistence**: Use `Buffer` to handle Yjs binary data in the Node.js pg client.
