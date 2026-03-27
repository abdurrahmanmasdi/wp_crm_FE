import { api } from '@/lib/api';

/**
 * User information in a conversation
 */
export interface ConversationUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

/**
 * Latest message in a conversation
 */
export interface LatestMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  sender: ConversationUser;
}

/**
 * Participant in a conversation
 */
export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  user: ConversationUser;
}

/**
 * Conversation/Chat room
 */
export interface Conversation {
  id: string;
  organization_id: string;
  is_group: boolean;
  name: string | null;
  created_at: string;
  updated_at: string;
  messages?: LatestMessage[];
  participants: ConversationParticipant[];
}

/**
 * Full message in a conversation
 */
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  sender: ConversationUser;
}

/**
 * Response type for list of conversations
 */
export interface ConversationsResponse {
  data: Conversation[];
}

/**
 * Response type for list of messages
 */
export interface MessagesResponse {
  data: Message[];
}

/**
 * Chat API service
 * Handles all chat-related API calls
 */
export const chatService = {
  /**
   * Get all conversations for the current user
   * @returns Promise containing array of conversations
   */
  getConversations() {
    return api.get<ConversationsResponse>('/chat/conversations');
  },

  /**
   * Get messages for a specific conversation
   * @param conversationId - The UUID of the conversation
   * @returns Promise containing array of messages
   */
  getConversationMessages(conversationId: string) {
    return api.get<MessagesResponse>(
      `/chat/conversations/${conversationId}/messages`
    );
  },

  /**
   * Get a specific conversation with all details
   * @param conversationId - The UUID of the conversation
   * @returns Promise containing the conversation details
   */
  getConversation(conversationId: string) {
    return api.get<{ data: Conversation }>(
      `/chat/conversations/${conversationId}`
    );
  },

  /**
   * Create a new conversation
   * @param payload - Object containing conversation creation details
   * @returns Promise containing the created conversation
   */
  createConversation(payload: {
    participantIds: string[];
    isGroup: boolean;
    name?: string;
  }) {
    return api.post<{ data: Conversation }>('/chat/conversations', payload);
  },
};
