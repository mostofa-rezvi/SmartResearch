# Phase 16: Yjs Editor WS Connection - Execution Plan

## 1. Provider Setup (`YjsProvider.tsx`)
Create a React Context Provider to encapsulate the Yjs Document, the Socket.IO provider, and the Awareness state. This ensures a singleton connection per document that safely mounts/unmounts.

### File: `frontend/src/components/editor/YjsProvider.tsx`
- Setup context with `YjsContextType` (doc, provider, awareness, status).
- Inside the provider:
  - Initialize `Y.Doc` using `useMemo`.
  - In a `useEffect`, initialize `io()` connection to backend WebSocket with exponential backoff (`reconnectionDelayMax`, `reconnectionAttempts`).
  - Initialize `SocketIOProvider` using the socket URI and document ID.
  - Setup socket event listeners for connection status (`connect`, `disconnect`).
  - Return `YjsContext.Provider`.
  - Cleanup: `provider.destroy()`, `socket.disconnect()`, `doc.destroy()`.

## 2. React Hook (`useYjs.ts`)
Create a custom hook for consuming the context within the editor and child components.

### File: `frontend/src/hooks/useYjs.ts`
- Access `YjsContext`.
- Provide reactive state for `activeUsers` using the awareness object.
- `useEffect` to listen to `awareness.on('change', ...)` and map states to `activeUsers`.
- Return `{ doc, provider, awareness, status, activeUsers }`.

## 3. Collaborative Editor Component Wiring
- Ensure the editor component consumes `useYjs`.
- Bind the Editor's Yjs bindings (e.g. `y-prosemirror` or `y-quill`) to the `doc` provided by the hook.
- Implement an offline indicator based on the `status` string from the hook.

## 4. Reconnection & Offline Support Verification
- Ensure `y-socket.io` handles resync steps automatically upon `socket.io` reconnection events.
- Disconnect socket, make local edits, reconnect, and verify payload gets pushed to the server.
