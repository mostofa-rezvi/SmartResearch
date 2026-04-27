# REVIEW — Phase 10: Collaboration Workspace Backend

## Review Summary
The relational schema, RBAC project logic, and milestone finite state machine (FSM) are solid and securely implemented. However, the real-time WebSocket layer contains critical security flaws regarding authentication and room isolation that must be addressed before production use.

## Finding 1: Unauthenticated Socket Connections (Severity: CRITICAL)
- **File**: `backend/src/index.js`
- **Issue**: The Socket.IO server allows any client to connect (`io.on('connection')`) and join a project room (`socket.on('join_project', (projectId, user))`) by simply passing arbitrary user data from the client. There is no token validation on the WebSocket handshake.
- **Impact**: Malicious actors can spoof any user identity, join private project rooms, and read/write real-time updates.
- **Recommendation**: Implement Socket.IO middleware (`io.use`) to parse and validate the JWT from the connection headers/handshake before allowing the connection.

## Finding 2: Lack of Room Broadcast Isolation (Severity: HIGH)
- **File**: `backend/src/index.js`
- **Issue**: In the `sync:update` listener, a client passes the `projectId`. The server blindly broadcasts to `project_${projectId}` without verifying if the current socket actually joined that room or is authorized for that project.
- **Impact**: A connected user could inject Yjs binary payloads into any project room by guessing the ID.
- **Recommendation**: Verify that `socket.rooms.has(room)` is true before broadcasting the update or passing it to the CollaborationService.

## Finding 3: Yjs Concurrent Postgres Updates (Severity: MEDIUM)
- **File**: `backend/src/services/CollaborationService.js`
- **Issue**: The update logic uses `SELECT ... FOR UPDATE`, decodes the state in memory, merges, and updates the blob. If multiple high-frequency updates arrive concurrently from the same Node instance, the Postgres row lock will force sequential processing.
- **Impact**: Safe from data corruption, but could become a performance bottleneck (high latency) under heavy concurrent editing.
- **Recommendation**: Implement an in-memory Yjs Document cache for active rooms in Node.js, and persist to Postgres on a debounced timer (e.g., every 5 seconds) rather than on every single keystroke chunk.

## Finding 4: Milestone FSM Admin Check (Severity: LOW)
- **File**: `backend/src/services/MilestoneService.js`
- **Issue**: The check restricts the `DONE` status to Admins, but any user could transition a milestone back from `DONE` to `REVIEW` (since there's no auth check for that specific reverse path).
- **Impact**: Potential disruption of finalized milestones.
- **Recommendation**: Expand the Admin RBAC check to cover any transition leading *out* of `DONE`.

## Security Audit
- [❌] **WebSocket Auth**: Missing entirely.
- [✓] **REST API Auth**: Validated via `auth` middleware (inherited from project defaults).
- [✓] **SQL Injection**: Parameterized queries used everywhere.

## Code Quality
- [✓] **Transaction Safety**: `BEGIN` and `COMMIT` wrap complex project creations.
- [✓] **CRDT Integration**: Correctly uses `Y.applyUpdate` and `Y.encodeStateAsUpdate`.
