import {
  useInfiniteQuery,
  useQuery,
  UseQueryResult,
} from '@tanstack/react-query';
import axios from 'axios';

import { getConversations, getConversationMessages } from '@/lib/api/chat';
import { queryKeys } from '@/lib/query-keys';
import { Conversation, Message } from '@/lib/chat.service';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Number of messages requested per page when fetching chat history.
 */
export const CHAT_HISTORY_PAGE_SIZE = 50;

/**
 * Builds the canonical query key for a conversation's message history.
 *
 * @param organizationId Active organization ID used to scope cache entries.
 * @param conversationId Conversation ID whose message timeline is cached.
 * @returns A readonly React Query key tuple for conversation messages.
 */
export function conversationMessagesQueryKey(
  organizationId: string | null | undefined,
  conversationId: string | null
) {
  return queryKeys.chat.messages(organizationId, conversationId);
}

function shouldRetryRequest(failureCount: number, error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      return false;
    }
  }

  return failureCount < 3;
}

/**
 * Loads the active organization's conversation list.
 *
 * React Query state managed:
 * - Query key: `queryKeys.chat.conversations(activeOrganizationId)`
 * - Retry policy that skips auth/permission failures.
 *
 * @returns React Query result object for conversation list loading, errors, and cached data.
 */
export function useConversationsQuery(): UseQueryResult<Conversation[], Error> {
  const organizationId = useAuthStore((state) => state.activeOrganizationId);

  return useQuery<Conversation[], Error>({
    queryKey: queryKeys.chat.conversations(organizationId),
    queryFn: getConversations,
    enabled: Boolean(organizationId),
    staleTime: 30 * 1000, // 30 seconds
    retry: shouldRetryRequest,
  });
}

/**
 * Loads message history for a conversation using an infinite query.
 *
 * React Query state managed:
 * - Query key: `conversationMessagesQueryKey(activeOrganizationId, conversationId)`
 * - Cursor-based pagination via `getNextPageParam`.
 *
 * @param conversationId Conversation ID to load. Query remains disabled when absent.
 * @returns Infinite query result with message pages and paging helpers.
 */
export function useChatHistoryQuery(conversationId: string | null) {
  const organizationId = useAuthStore((state) => state.activeOrganizationId);

  return useInfiniteQuery<Message[], Error>({
    queryKey: conversationMessagesQueryKey(organizationId, conversationId),
    queryFn: ({ pageParam }) =>
      getConversationMessages(
        conversationId!,
        pageParam as string | undefined,
        CHAT_HISTORY_PAGE_SIZE
      ),
    initialPageParam: undefined,
    enabled: Boolean(organizationId && conversationId),
    staleTime: 30 * 1000, // 30 seconds
    retry: shouldRetryRequest,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < CHAT_HISTORY_PAGE_SIZE) {
        return undefined;
      }

      const lastMessage = lastPage[lastPage.length - 1];
      return lastMessage?.id;
    },
  });
}
