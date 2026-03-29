import { api } from '@/lib/api';
import {
  ConversationsResponse,
  MessagesResponse,
  Conversation,
} from '@/lib/chat.service';

/**
 * Fetches the authenticated user's conversation list for the active organization.
 *
 * Endpoint: `GET /chat/conversations`
 *
 * @returns A promise that resolves to the conversation array returned by the API `data` envelope.
 */
export const getConversations = async () => {
  const response = await api.get<ConversationsResponse>('/chat/conversations');
  return response.data.data;
};

/**
 * Fetches paginated messages for a conversation using cursor-based pagination.
 *
 * Endpoint: `GET /chat/conversations/:conversationId/messages`
 *
 * @param conversationId The UUID of the conversation whose messages should be loaded.
 * @param cursor Optional message ID cursor used to request older messages.
 * @param limit Maximum number of messages to return in a single request.
 * @returns A promise that resolves to the messages array returned by the API `data` envelope.
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
 * Creates a new direct (1:1) conversation with a target user.
 *
 * Endpoint: `POST /chat/conversations`
 *
 * @param targetUserId The UUID of the user to start a conversation with.
 * @returns A promise that resolves to the created conversation from the API `data` envelope.
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
 * Creates a new group conversation with a name and participant IDs.
 *
 * Endpoint: `POST /chat/groups`
 *
 * @param payload Group payload containing `name` and `participantIds`.
 * @returns A promise that resolves to the created conversation from the API `data` envelope.
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
