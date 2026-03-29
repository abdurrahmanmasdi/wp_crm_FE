import { api } from '@/lib/api';
import {
  ConversationsResponse,
  MessagesResponse,
  Conversation,
} from '@/lib/chat.service';

/**
 * Get all conversations for the current user
 * Automatically includes x-organization-id header from interceptor
 * @returns Promise containing array of conversations
 */
export const getConversations = async () => {
  const response = await api.get<ConversationsResponse>('/chat/conversations');
  return response.data.data;
};

/**
 * Get messages for a specific conversation
 * @param conversationId - The UUID of the conversation
 * @param cursor - Optional cursor (message id) for loading older messages
 * @param limit - Page size for cursor pagination
 * @returns Promise containing array of messages
 */
export const getConversationMessages = async (
  conversationId: string,
  cursor?: string,
  limit = 50
) => {
  const params: { cursor?: string; limit: number } = { limit };

  if (cursor) {
    params.cursor = cursor;
  }

  const response = await api.get<MessagesResponse>(
    `/chat/conversations/${conversationId}/messages`,
    { params }
  );
  return response.data.data;
};

/**
 * Create a new 1-on-1 conversation with a target user
 * @param targetUserId - The UUID of the user to start a conversation with
 * @returns Promise containing the created conversation
 */
export const createConversation = async (
  targetUserId: string
): Promise<Conversation> => {
  const response = await api.post<{ status: string; data: Conversation }>(
    '/chat/conversations',
    {
      targetUserId,
    }
  );
  return response.data.data;
};

/**
 * Create a new group conversation
 * @param payload - Object containing group name and participant IDs
 * @returns Promise containing the created conversation
 */
export const createGroupConversation = async (payload: {
  name: string;
  participantIds: string[];
}): Promise<Conversation> => {
  const response = await api.post<{ status: string; data: Conversation }>(
    '/chat/groups',
    payload
  );
  return response.data.data;
};
