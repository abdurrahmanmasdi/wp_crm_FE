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

export const CHAT_HISTORY_PAGE_SIZE = 50;

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
 * Hook to fetch all conversations for the current user
 * @returns React Query result containing array of conversations
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
 * Hook to fetch messages for a specific conversation
 * @param conversationId - The conversation ID (query is disabled if not provided)
 * @returns React Query result containing array of messages
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
