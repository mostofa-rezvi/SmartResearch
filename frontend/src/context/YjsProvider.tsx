"use client";

import React, { createContext, useEffect, useState, useMemo } from 'react';
import * as Y from 'yjs';
import { SocketIOProvider } from 'y-socket.io';
import { io } from 'socket.io-client';

export interface YjsContextType {
  doc: Y.Doc;
  provider: SocketIOProvider | null;
  awareness: any;
  status: 'connecting' | 'connected' | 'disconnected';
}

export const YjsContext = createContext<YjsContextType | null>(null);

export const YjsProvider = ({ documentId, children }: { documentId: string, children: React.ReactNode }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // Initialize Doc exactly once per mount
  const doc = useMemo(() => new Y.Doc(), []);

  const [provider, setProvider] = useState<SocketIOProvider | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    // 1. Initialize Socket.IO with Reconnection Logic
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000', {
      reconnectionDelayMax: 10000,
      reconnectionAttempts: Infinity,
      transports: ['websocket'],
      auth: { token }
    });

    // 2. Initialize y-socket.io Provider
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    const yjsProvider = new SocketIOProvider(
      socketUrl,
      `doc-room-${documentId}`,
      doc,
      { autoConnect: true, auth: { token } } as any
    );

    setProvider(yjsProvider);

    // 3. Status handling
    yjsProvider.on('status', ({ status }: { status: string }) => {
      setStatus(status as any);
    });

    socket.on('connect', () => setStatus('connected'));
    socket.on('disconnect', () => setStatus('disconnected'));

    // 4. Awareness setup
    const awareness = yjsProvider.awareness;
    
    // Set some random default user details for now (can be passed from Auth later)
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
    awareness.setLocalStateField('user', {
      name: `User ${Math.floor(Math.random() * 100)}`,
      color: randomColor,
    });

    return () => {
      yjsProvider.destroy();
      socket.disconnect();
      doc.destroy();
    };
  }, [documentId, doc]);

  return (
    <YjsContext.Provider value={{ doc, provider, awareness: provider?.awareness, status }}>
      {children}
    </YjsContext.Provider>
  );
};
