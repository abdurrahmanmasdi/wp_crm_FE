'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import io from 'socket.io-client';
import Cookies from 'js-cookie';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';

// Get the socket type from the return type of io
type SocketInstance = ReturnType<typeof io>;

/**
 * SocketProvider component that listens for global record updates
 * and invalidates React Query cache when records change
 *
 * @param children - React child components
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<SocketInstance | null>(null);
  const queryClient = useQueryClient();

  const activeOrganizationId = useAuthStore(
    (state) => state.activeOrganizationId
  );

  // Changes to token or org context should recreate the socket session.
  const userToken = Cookies.get('access_token') ?? null;

  /**
   * Effect: Initialize socket connection for global cache invalidation
   * Listens to 'record.updated' events and invalidates all queries
   */
  useEffect(() => {
    // Close any existing socket if auth/org context is no longer valid.
    if (!activeOrganizationId || !userToken) {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Ensure we never keep more than one live socket instance.
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Get the socket URL from environment or use default
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

    // Create socket instance with authentication
    const socketInstance = io(socketUrl, {
      auth: {
        token: userToken,
        organizationId: activeOrganizationId,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
      reconnectionAttempts: 10,
      timeout: 20000,
      transports: ['websocket'],
      upgrade: false,
    });

    socketRef.current = socketInstance;

    const handleConnect = () => {
      console.log('[SocketProvider] Connected:', socketInstance.id);
    };

    const handleDisconnect = () => {
      console.log('[SocketProvider] Disconnected');
    };

    /**
     * Handler for 'record.updated' event
     * Invalidates all queries to refetch data from the backend
     */
    const handleRecordUpdated = (data: unknown) => {
      console.log('[SocketProvider] Record updated:', data);
      queryClient.invalidateQueries();
    };

    // Attach event listeners
    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('record.updated', handleRecordUpdated);

    // Cleanup on unmount or dependency change
    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.off('record.updated', handleRecordUpdated);
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [activeOrganizationId, userToken, queryClient]);

  return <>{children}</>;
}
