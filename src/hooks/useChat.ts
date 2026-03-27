import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getConversations, getConversationMessages } from '@/lib/api/chat';
import { Conversation, Message } from '@/lib/chat.service';

/**
 * Hook to fetch all conversations for the current user
 * @returns React Query result containing array of conversations
 */
export function useConversationsQuery(): UseQueryResult<Conversation[], Error> {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
    staleTime: 30 * 1000, // 30 seconds
    retry: 3,
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
  return useQuery({
    queryKey: ['conversation-messages', conversationId],
    queryFn: () => getConversationMessages(conversationId!),
    enabled: !!conversationId,
    staleTime: 30 * 1000, // 30 seconds
    retry: 3,
  });
}
