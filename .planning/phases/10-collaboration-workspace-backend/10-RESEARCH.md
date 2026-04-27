# RESEARCH — Phase 10: Collaboration Workspace Backend

## Research Objective
Validate the Yjs-Postgres binary sync loop and the Socket.IO room lifecycle.

## 1. Yjs Binary Persistence in Node.js
- **Strategy**: 
    - Incoming update: `Y.applyUpdate(doc, updateChunk)`.
    - Persistence: `Y.encodeStateAsUpdate(doc)` -> `Buffer` -> `UPDATE collaborative_docs SET content_binary = $1`.
- **Finding**: Storing the cumulative state as a single blob is efficient for small-to-medium documents. For very large documents, incremental update logs are better (deferred to Phase 11).

## 2. Socket.IO Room Lifecycle
- **Problem**: Cleaning up presence if a server crashes.
- **Solution**: 
    - Socket.IO `disconnect` event handles normal cleanup.
    - Redis `EXPIRE` on presence keys (if stored in Redis) or standard Socket.IO room counts if using a single instance.
- **Decision**: Use `socket.io-adapter-redis` to ensure room counts are accurate across the cluster.

## 3. Milestone FSM Logic
- **Constraint**: Milestone updates must emit an event to the `project` room so all users see the UI change instantly.
- **Action**: Add an `after-update` hook in the Milestone service to broadcast the new status.

## Verification Checklist
- [ ] Postgres migration for project/milestone/task/doc tables.
- [ ] Socket.IO presence events show user join/leave in room.
- [ ] Yjs document survives server restart (loads from Postgres BYTEA).
- [ ] Milestone status transitions restricted by role.
