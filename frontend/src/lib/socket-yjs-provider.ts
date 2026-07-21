import * as Y from "yjs";
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
  removeAwarenessStates,
} from "y-protocols/awareness";
import { io, Socket } from "socket.io-client";

export type YjsStatus = "connecting" | "connected" | "disconnected";

interface ProviderOpts {
  token?: string | null;
  user: { name: string; color: string };
}

/**
 * Yjs network provider that speaks the ResearchBridge backend's collaboration
 * protocol (see backend/src/index.js socket handlers + CollaborationService):
 *
 *   emit  join_project(projectId, user)     → server verifies membership, joins room
 *   recv  sync:init(state)                   → initial Y.Doc state (Y.encodeStateAsUpdate)
 *   emit  sync:update(projectId, update)     → local Y.Doc changes (persisted server-side)
 *   recv  sync:update(update)                → remote changes to apply
 *   emit  awareness:update(projectId, upd)   → local cursor/presence (relayed, not persisted)
 *   recv  awareness:update(upd)              → remote presence
 *
 * This replaces the previous `y-socket.io` `SocketIOProvider`, which required a
 * `y-socket.io` server the backend never ran. Exposes `.awareness` (for TipTap's
 * CollaborationCursor) and `.on('status', cb)`.
 */
export class SocketYjsProvider {
  doc: Y.Doc;
  awareness: Awareness;
  socket: Socket;
  roomId: string;

  private _status: YjsStatus = "connecting";
  private statusListeners: Array<(s: { status: YjsStatus }) => void> = [];
  private user: { name: string; color: string };
  private docUpdateHandler: (update: Uint8Array, origin: unknown) => void;
  private awarenessHandler: (changes: { added: number[]; updated: number[]; removed: number[] }, origin: unknown) => void;

  constructor(socketUrl: string, projectId: string, doc: Y.Doc, opts: ProviderOpts) {
    this.doc = doc;
    this.roomId = String(projectId);
    this.user = opts.user;
    this.awareness = new Awareness(doc);
    this.awareness.setLocalStateField("user", opts.user);

    this.socket = io(socketUrl, {
      transports: ["websocket"],
      reconnectionDelayMax: 10000,
      reconnectionAttempts: Infinity,
      auth: { token: opts.token },
    });

    // ── connection lifecycle ──────────────────────────────────────────────
    this.socket.on("connect", () => {
      this.setStatus("connected");
      this.socket.emit("join_project", this.roomId, opts.user);
      // announce our presence to peers already in the room
      this.broadcastAwareness([this.doc.clientID]);
    });
    this.socket.on("disconnect", () => this.setStatus("disconnected"));
    this.socket.on("connect_error", () => this.setStatus("disconnected"));

    // ── document sync ─────────────────────────────────────────────────────
    this.socket.on("sync:init", (state: ArrayBuffer | Uint8Array) => {
      if (state) Y.applyUpdate(this.doc, new Uint8Array(state as ArrayBuffer), this);
    });
    this.socket.on("sync:update", (update: ArrayBuffer | Uint8Array) => {
      Y.applyUpdate(this.doc, new Uint8Array(update as ArrayBuffer), this);
    });

    this.docUpdateHandler = (update: Uint8Array, origin: unknown) => {
      // don't echo updates we applied from the network
      if (origin === this) return;
      this.socket.emit("sync:update", this.roomId, update);
    };
    this.doc.on("update", this.docUpdateHandler);

    // ── awareness (cursors / presence) ────────────────────────────────────
    this.socket.on("awareness:update", (update: ArrayBuffer | Uint8Array) => {
      applyAwarenessUpdate(this.awareness, new Uint8Array(update as ArrayBuffer), this);
    });

    this.awarenessHandler = ({ added, updated, removed }, origin) => {
      if (origin === this) return; // remote change — already applied, don't rebroadcast
      this.broadcastAwareness(added.concat(updated).concat(removed));
    };
    this.awareness.on("update", this.awarenessHandler);
  }

  private broadcastAwareness(clients: number[]) {
    if (!this.socket.connected || clients.length === 0) return;
    const update = encodeAwarenessUpdate(this.awareness, clients);
    this.socket.emit("awareness:update", this.roomId, update);
  }

  private setStatus(status: YjsStatus) {
    this._status = status;
    this.statusListeners.forEach((cb) => cb({ status }));
  }

  get status(): YjsStatus {
    return this._status;
  }

  on(event: "status", cb: (s: { status: YjsStatus }) => void) {
    if (event === "status") this.statusListeners.push(cb);
  }

  destroy() {
    try {
      removeAwarenessStates(this.awareness, [this.doc.clientID], "destroy");
    } catch {
      /* noop */
    }
    this.doc.off("update", this.docUpdateHandler);
    this.awareness.off("update", this.awarenessHandler);
    if (this.socket.connected) this.socket.emit("leave_project", this.roomId, this.user);
    this.socket.disconnect();
    this.awareness.destroy();
  }
}
