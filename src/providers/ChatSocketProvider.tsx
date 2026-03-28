'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import io from 'socket.io-client';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/useAuthStore';

// Get the socket type from the return type of io
type SocketInstance = ReturnType<typeof io>;

/**
 * Context type for the chat socket
 */
interface ChatSocketContextType {
  socket: SocketInstance | null;
  isConnected: boolean;
}

/**
 * React Context for managing the chat socket connection
 */
const ChatSocketContext = createContext<ChatSocketContextType | undefined>(
  undefined
);

/**
 * ChatSocketProvider component that manages the socket.io connection
 * Provides the socket instance and connection state to child components
 *
 * @param children - React child components
 */
export function ChatSocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<SocketInstance | null>(null);
  const [socket, setSocket] = useState<SocketInstance | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Keep effect dependencies primitive to avoid accidental reconnect loops.
  const userId = useAuthStore((state) => {
    const candidate = state.user;
    if (!candidate || typeof candidate !== 'object' || !('id' in candidate)) {
      return null;
    }

    return String((candidate as { id: string }).id);
  });
  const activeOrganizationId = useAuthStore(
    (state) => state.activeOrganizationId
  );
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);

  // Primitive auth token dependency; changes trigger a fresh socket session.
  const userToken = Cookies.get('access_token') ?? null;

  /**
   * Effect: Initialize a single socket instance for the active org + token
   * Uses socket.io built-in backoff and avoids reconnecting from React state changes.
   */
  useEffect(() => {
    // Close any existing socket if auth/org context is no longer valid.
    if (!_hasHydrated || !userId || !activeOrganizationId || !userToken) {
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

    // Get the WebSocket URL from environment or use default
    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL || 'http://127.0.0.1:3000/chat';

    // Create socket instance with authentication
    const socketInstance = io(wsUrl, {
      auth: {
        token: userToken,
        orgId: activeOrganizationId,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
      reconnectionAttempts: 10,
      timeout: 20000,
      transports: ['websocket'], // CRITICAL: Skip HTTP polling which causes CORS noise.
      upgrade: false, // Prevent transport fallback to polling.
    });
    socketRef.current = socketInstance;

    const handleConnect = () => {
      console.log(
        `[ChatSocketProvider] Stable connection established: ${socketInstance.id}`
      );
      setSocket(socketInstance);
      setIsConnected(true);
    };

    const handleDisconnect = (reason: string) => {
      console.log(
        `[ChatSocketProvider] Disconnected from chat server: ${reason}`
      );
      setIsConnected(false);
    };

    const handleConnectError = (error: Error) => {
      // Do not update React state here to avoid triggering reconnection cycles.
      console.error(
        `[ChatSocketProvider] Connection error: ${error.message || 'websocket error'}`
      );
    };

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('connect_error', handleConnectError);

    /**
     * Disconnect and detach listeners on dependency change/unmount.
     */
    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.off('connect_error', handleConnectError);
      socketInstance.disconnect();
      if (socketRef.current === socketInstance) {
        socketRef.current = null;
      }
      setSocket((current) => (current === socketInstance ? null : current));
      setIsConnected(false);
    };
  }, [_hasHydrated, userId, activeOrganizationId, userToken]);

  return (
    <ChatSocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </ChatSocketContext.Provider>
  );
}

/**
 * Hook to use the chat socket context
 * Must be used within a ChatSocketProvider
 *
 * @throws {Error} If used outside of ChatSocketProvider
 * @returns {ChatSocketContextType} The socket context with socket instance and connection state
 */
export function useChatSocket(): ChatSocketContextType {
  const context = useContext(ChatSocketContext);

  if (context === undefined) {
    throw new Error(
      'useChatSocket must be used within a ChatSocketProvider. ' +
        'Make sure to wrap your component with <ChatSocketProvider>.'
    );
  }

  return context;
}

/**
 * Hook to use only the socket instance
 * Useful for components that only need the socket, not the connection state
 *
 * @throws {Error} If used outside of ChatSocketProvider
 * @returns {SocketInstance | null} The socket.io instance or null if not connected
 */
export function useSocket(): SocketInstance | null {
  const { socket } = useChatSocket();
  return socket;
}

/**
 * Hook to check if socket is connected
 * Useful for conditional rendering based on connection state
 *
 * @throws {Error} If used outside of ChatSocketProvider
 * @returns {boolean} True if socket is connected
 */
export function useSocketConnected(): boolean {
  const { isConnected } = useChatSocket();
  return isConnected;
}
