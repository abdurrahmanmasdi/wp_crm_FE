import { useQuery, UseQueryResult } from '@tanstack/react-query';
import axios from 'axios';
import { getConversations, getConversationMessages } from '@/lib/api/chat';
import { Conversation, Message } from '@/lib/chat.service';

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
  return useQuery<Conversation[], Error>({
    queryKey: ['conversations'],
    queryFn: getConversations,
    staleTime: 30 * 1000, // 30 seconds
    retry: shouldRetryRequest,
  });
}

/**
 * Hook to fetch messages for a specific conversation
 * @param conversationId - The conversation ID (query is disabled if not provided)
 * @returns React Query result containing array of messages
 */
export function useChatHistoryQuery(
  conversationId: string | null
): UseQueryResult<Message[], Error> {
  return useQuery<Message[], Error>({
    queryKey: ['conversation-messages', conversationId],
    queryFn: () => getConversationMessages(conversationId!),
    enabled: !!conversationId,
    staleTime: 30 * 1000, // 30 seconds
    retry: shouldRetryRequest,
  });
}
