# Phase 16 Code Review: Yjs Editor WS Connection

## Overview
This code review focuses on the newly implemented Yjs collaborative editor, specifically checking for race conditions, memory leaks, and reconnection edge cases in `YjsProvider.tsx`, `useYjs.ts`, and `collaborative-editor.tsx`.

## Critical Findings (Blocking)

### 1. 🔴 Race Condition: Tiptap Cursor Extension initializes before Provider
**File:** `frontend/src/components/collaborative-editor.tsx`
**Description:** The `useEditor` hook is initialized immediately, but `YjsProvider` initializes `SocketIOProvider` asynchronously inside a `useEffect`. Because `useEditor` does not have a dependency array or re-initialization logic natively for extensions, `CollaborationCursor` is initialized with `provider: null`. When the provider later connects, the extension doesn't update, resulting in broken cursor synchronization.
**Fix:** Conditionally render the `<EditorContent>` (or the inner component) only when `provider` is not null. 

### 2. 🔴 Memory Leak / React Strict Mode Bug: Y.Doc Lifecycle
**File:** `frontend/src/context/YjsProvider.tsx`
**Description:** `const doc = useMemo(() => new Y.Doc(), []);` is used to create the document, but `doc.destroy()` is called in the `useEffect` cleanup. In React 18 Strict Mode (or during Fast Refresh), `useEffect` is run, cleaned up, and run again without recreating the `useMemo` instance. The second `useEffect` run will attempt to bind to a destroyed `Y.Doc`, causing fatal sync errors.
**Fix:** Either manage the `Y.Doc` lifecycle entirely inside the `useEffect`, or use a `useRef` and ensure it is recreated if destroyed, or skip calling `doc.destroy()` if you rely on garbage collection for the singleton (not recommended for strict cleanup). The safest approach is moving `new Y.Doc()` inside the `useEffect` and updating state, or keeping it in a `useRef` and explicitly recreating it on reconnects.

## Non-Critical Findings (Warnings)

### 3. 🟡 Reconnection Edge Case: Ghost Cursors
**File:** `frontend/src/hooks/useYjs.ts`
**Description:** When the user disconnects, their awareness state might not be cleared properly from other clients if the server doesn't enforce timeouts. `y-protocols/awareness` handles timeouts locally, but the local client should ideally broadcast an offline state before closing.
**Fix:** Set `awareness.setLocalState(null)` inside the cleanup function of `YjsProvider` before destroying the provider.

## Next Steps
Use `/gsd-fast` or a quick execution step to apply these fixes before continuing to the Kanban integration.
