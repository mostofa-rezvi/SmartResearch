"use client";

import React, { createContext, useEffect, useState, useMemo } from "react";
import * as Y from "yjs";
import { SocketYjsProvider, YjsStatus } from "@/lib/socket-yjs-provider";
import { useAuth } from "@/context/AuthContext";

export interface YjsContextType {
  doc: Y.Doc;
  provider: SocketYjsProvider | null;
  awareness: any;
  status: YjsStatus;
  versionTrigger: number;
}

export const YjsContext = createContext<YjsContextType | null>(null);

// Stable per-user color derived from a string (so a user keeps the same cursor color).
function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const palette = ["#EC4899", "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#84CC16"];
  return palette[h % palette.length];
}

export const YjsProvider = ({ documentId, children }: { documentId: string; children: React.ReactNode }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<YjsStatus>("connecting");
  const [versionTrigger, setVersionTrigger] = useState(0);

  // Fresh doc per versionTrigger (used when a document is reverted)
  const doc = useMemo(() => new Y.Doc(), [versionTrigger]);
  const [provider, setProvider] = useState<SocketYjsProvider | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    const displayName = user?.name || "Anonymous";
    const identity = { name: displayName, color: colorFor(String(user?.id || displayName)) };

    const yjsProvider = new SocketYjsProvider(socketUrl, documentId, doc, { token, user: identity });
    setProvider(yjsProvider);

    yjsProvider.on("status", ({ status }) => setStatus(status));

    // When the backend broadcasts a revert, rebuild the doc from scratch
    yjsProvider.socket.on("sync:reverted", () => setVersionTrigger((prev) => prev + 1));

    return () => {
      yjsProvider.destroy();
      doc.destroy();
    };
  }, [documentId, doc, versionTrigger, user?.id, user?.name]);

  return (
    <YjsContext.Provider value={{ doc, provider, awareness: provider?.awareness, status, versionTrigger }}>
      {children}
    </YjsContext.Provider>
  );
};
