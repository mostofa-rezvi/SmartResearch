# Phase 21: Security & ML Hardening - Context

**Gathered:** 2026-06-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Security & ML Hardening — WebSocket JWT handshake and SBERT threshold calibration. Specifically, reject unauthenticated connections to Socket.IO, and verify user is a project member before joining a room.

</domain>

<decisions>
## Implementation Decisions

### Token Transport
- **D-01:** Use `auth` payload (`socket.io({ auth: { token } })`) for sending the JWT during the handshake.

### Token Expiration/Renewal
- **D-02:** Only check token validity on initial connection and when joining project rooms. Do nothing while the socket is connected.

### Authorization Failure Response
- **D-03:** When an unauthorized user tries to join a project room, send an `error` event but keep the socket connected.

### the agent's Discretion
- Code extraction patterns for `auth.js` reuse.
- Formatting of the `error` event payload.

</decisions>

<canonical_refs>
## Canonical References

No external specs — requirements are fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/middleware/auth.js`: Already contains a basic `socketAuthMiddleware`. Can be updated to expect the token in `socket.handshake.auth.token`.

### Integration Points
- `src/index.js`: Socket.IO connection handling and room joining logic.

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 21-security-ml-hardening*
*Context gathered: 2026-06-07*
