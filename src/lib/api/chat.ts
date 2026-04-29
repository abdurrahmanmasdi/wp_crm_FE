import {
  chatControllerCreateConversationV1,
  chatControllerGetConversationMessagesV1,
  chatControllerGetConversationsV1,
} from '@/api-generated/endpoints/chat';
import type {
  ChatControllerGetConversationMessagesV1Params,
  CreateConversationDto,
} from '@/api-generated/model';
import type { Conversation, Message } from '@/types/chat-generated';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function extractList(root: unknown, listKeys: string[]): unknown[] {
  if (Array.isArray(root)) {
    return root;
  }

  const record = asRecord(root);

  for (const key of listKeys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function normalizeUser(raw: unknown) {
  const record = asRecord(raw);

  return {
    id: asString(record.id),
    first_name: asString(record.first_name) || asString(record.firstName),
    last_name: asString(record.last_name) || asString(record.lastName),
    email: asString(record.email),
  };
}

function normalizeMessage(
  raw: unknown,
  fallbackConversationId?: string
): Message | null {
  const record = asRecord(raw);
  const id = asString(record.id);
  const conversationId =
    asString(record.conversation_id) ||
    asString(record.conversationId) ||
    asString(fallbackConversationId);
  const senderId = asString(record.sender_id) || asString(record.senderId);

  if (!id || !conversationId) {
    return null;
  }

  const sender = normalizeUser(record.sender);
  const messageType = asString(record.type);
  const isAiMessageType = messageType.startsWith('AI_');
  const safeSender =
    sender.id || sender.first_name || sender.last_name || sender.email
      ? sender
      : {
          id: senderId,
          first_name: isAiMessageType ? 'AI' : '',
          last_name: isAiMessageType ? 'Assistant' : '',
          email: '',
        };

  return {
    id,
    conversation_id: conversationId,
    sender_id: senderId,
    content: asString(record.content),
    type: messageType || undefined,
    created_at: asString(record.created_at) || asString(record.createdAt),
    updated_at: asString(record.updated_at) || asString(record.updatedAt),
    sender: safeSender,
  };
}

function normalizeConversation(raw: unknown): Conversation | null {
  const record = asRecord(raw);
  const id = asString(record.id);

  if (!id) {
    return null;
  }

  const participants = extractList(record.participants, ['participants'])
    .map((participantRaw) => {
      const participant = asRecord(participantRaw);

      return {
        id: asString(participant.id),
        conversation_id:
          asString(participant.conversation_id) ||
          asString(participant.conversationId),
        user_id: asString(participant.user_id) || asString(participant.userId),
        joined_at:
          asString(participant.joined_at) || asString(participant.joinedAt),
        user: normalizeUser(participant.user),
      };
    })
    .filter((participant) => participant.id && participant.user.id);

  const messages = extractList(record.messages, ['messages'])
    .map((message) => normalizeMessage(message, id))
    .filter((message): message is Message => message !== null);

  return {
    id,
    organization_id:
      asString(record.organization_id) || asString(record.organizationId),
    is_group: asBoolean(record.is_group),
    name: asString(record.name) || null,
    created_at: asString(record.created_at) || asString(record.createdAt),
    updated_at: asString(record.updated_at) || asString(record.updatedAt),
    participants,
    messages,
  };
}

function extractConversation(root: unknown): Conversation {
  const record = asRecord(root);

  const maybeConversation = normalizeConversation(
    record.data && typeof record.data === 'object' ? record.data : record
  );

  if (!maybeConversation) {
    throw new Error('Unexpected conversation response');
  }

  return maybeConversation;
}

/**
 * Fetches the authenticated user's conversation list for the active organization.
 *
 * Endpoint: `GET /chat/conversations`
 *
 * @returns A promise that resolves to the conversation array returned by the API `data` envelope.
 */
export const getConversations = async () => {
  const response = (await chatControllerGetConversationsV1()) as unknown;

  return extractList(response, ['data', 'items', 'conversations'])
    .map(normalizeConversation)
    .filter(
      (conversation): conversation is Conversation => conversation !== null
    );
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
  const params: Partial<ChatControllerGetConversationMessagesV1Params> = {
    limit,
  };

  if (cursor) {
    params.cursor = cursor;
  }

  const response = (await chatControllerGetConversationMessagesV1(
    conversationId,
    params as ChatControllerGetConversationMessagesV1Params
  )) as unknown;

  return extractList(response, ['data', 'items', 'messages'])
    .map((message) => normalizeMessage(message, conversationId))
    .filter((message): message is Message => message !== null);
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
  const response = (await chatControllerCreateConversationV1({
    targetUserId,
  } as CreateConversationDto)) as unknown;

  return extractConversation(response);
};
