import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = window.location.origin;

let globalSocket: Socket | null = null;

export function useSocket(token: string | null) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    // Reuse existing socket connection if already authenticated
    if (globalSocket?.connected) {
      socketRef.current = globalSocket;
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => console.log('[Socket] Connected:', socket.id));
    socket.on('disconnect', (reason) => console.log('[Socket] Disconnected:', reason));
    socket.on('connect_error', (err) => console.error('[Socket] Error:', err.message));

    socketRef.current = socket;
    globalSocket = socket;

    return () => {
      // Don't disconnect on component unmount — keep alive for the session
    };
  }, [token]);

  const joinRoom = useCallback((sessionId: string) => {
    socketRef.current?.emit('session:join', { sessionId });
  }, []);

  const leaveRoom = useCallback((sessionId: string) => {
    socketRef.current?.emit('session:leave', { sessionId });
  }, []);

  const on = useCallback(<T>(event: string, handler: (data: T) => void) => {
    socketRef.current?.on(event, handler);
    return () => { socketRef.current?.off(event, handler); };
  }, []);

  const off = useCallback((event: string, handler?: (...args: unknown[]) => void) => {
    socketRef.current?.off(event, handler);
  }, []);

  return { socket: socketRef.current, joinRoom, leaveRoom, on, off };
}
