'use client';

import {
  createContext,
  useContext,
  useEffect,
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
  const [socket, setSocket] = useState<SocketInstance | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Get user and organization info from auth store - extract as primitives
  const user = useAuthStore((state) => state.user);
  const activeOrganizationId = useAuthStore(
    (state) => state.activeOrganizationId
  );
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);

  // Extract token as a simple string to stabilize dependency array
  const tokenString = Cookies.get('access_token');

  /**
   * Effect: Initialize socket connection
   * STABILIZED: Only depends on tokenString (a primitive string)
   * This prevents infinite reconnection loops
   */
  useEffect(() => {
    // Do nothing if there is no token or auth is not ready
    if (!tokenString || !_hasHydrated || !user || !activeOrganizationId) {
      return;
    }

    // Get the WebSocket URL from environment or use default
    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL || 'http://127.0.0.1:3000/chat';

    // Create socket instance with authentication
    const socketInstance = io(wsUrl, {
      auth: {
        token: tokenString,
        orgId: activeOrganizationId,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket'], // CRITICAL: Skips HTTP polling which causes CORS errors
      upgrade: false, // Prevent downgrading to polling
    });

    // Handle successful connection
    socketInstance.on('connect', () => {
      console.log(
        `[ChatSocketProvider] Stable connection established: ${socketInstance.id}`
      );
      setIsConnected(true);
    });

    // Handle disconnection
    socketInstance.on('disconnect', (reason: string) => {
      console.log(
        `[ChatSocketProvider] Disconnected from chat server: ${reason}`
      );
      setIsConnected(false);
    });

    // Handle connection errors
    socketInstance.on('connect_error', (error: Error) => {
      console.error('[ChatSocketProvider] Connection error:', error);
    });

    // Save to state
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(socketInstance);

    /**
     * CRITICAL CLEANUP: Disconnect when component unmounts or token changes
     * This prevents memory leaks and unstable connections
     */
    return () => {
      socketInstance.disconnect();
    };
  }, [tokenString, _hasHydrated, user, activeOrganizationId]);

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
