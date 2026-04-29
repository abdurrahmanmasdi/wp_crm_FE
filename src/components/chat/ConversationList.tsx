'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search, Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types/chat-generated';
import { useAuthStore } from '@/store/useAuthStore';
import { useConversationsQuery, conversationsQueryKey } from '@/hooks/useChat';
import { useChatSocket } from '@/providers/ChatSocketProvider';
import { NewChatDialog } from './NewChatDialog';

/**
 * ConversationList Component
 * Displays a list of all conversations for the user
 * Allows selecting a conversation to view its messages
 */
export function ConversationList() {
  const router = useRouter();
  const t = useTranslations('Chat');
  const searchParams = useSearchParams();
  const activeConversationId = searchParams.get('chat');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  // Get current user ID from auth store
  const user = useAuthStore((state) => state.user);
  const currentUserId =
    user && typeof user === 'object' && 'id' in user
      ? (user as { id: string }).id
      : null;

  const queryClient = useQueryClient();
  const { socket, isConnected } = useChatSocket();

  const organizationId = useAuthStore((state) => state.activeOrganizationId);

  /**
   * Fetch all conversations for the current user
   */
  const { data, isLoading, error } = useConversationsQuery();

  /**
   * WebSocket: listen for new_message events and optimistically update the
   * conversation list cache so the preview and ordering update instantly.
   *
   * Payload shape (same as ActiveChat):
   *   { type: "NEW_MESSAGE", organizationId, conversationId, message: { id, content, sender, createdAt, ... } }
   */
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (payload: unknown) => {
      const raw = payload as Record<string, unknown>;

      // Only handle the typed envelope; ignore legacy raw Message shapes here
      // because ConversationList doesn't need sub-conversation detail.
      if (raw.type !== 'NEW_MESSAGE' || !raw.message) return;

      const env = raw.message as Record<string, unknown>;
      const eventConversationId = String(raw.conversationId ?? '');
      const content = String(env.content ?? '');
      const isAiSender =
        String(env.sender ?? '').toUpperCase() === 'AI' ||
        String(env.type ?? '').startsWith('AI_');
      const senderName = isAiSender
        ? 'AI'
        : String(env.sender_name ?? env.sender_id ?? 'Unknown');
      const arrivedAt = String(
        env.createdAt ?? env.created_at ?? new Date().toISOString()
      );

      queryClient.setQueryData<Conversation[]>(
        conversationsQueryKey(organizationId),
        (prev) => {
          if (!prev) return prev;

          // Build a synthetic LatestMessage to replace the preview.
          const previewMessage = {
            id: String(env.id ?? `ws-${Date.now()}`),
            conversation_id: eventConversationId,
            sender_id: isAiSender ? '' : String(env.sender_id ?? ''),
            content,
            created_at: arrivedAt,
            updated_at: arrivedAt,
            sender: {
              id: String(env.sender_id ?? ''),
              first_name: senderName.split(' ')[0] ?? senderName,
              last_name: senderName.split(' ').slice(1).join(' ') ?? '',
              email: '',
            },
          };

          const index = prev.findIndex((c) => c.id === eventConversationId);

          if (index === -1) {
            // Conversation not yet in cache — do nothing (next poll will add it).
            return prev;
          }

          // Produce the updated conversation with the new preview + timestamp.
          const updated: Conversation = {
            ...prev[index]!,
            updated_at: arrivedAt,
            messages: [previewMessage],
          };

          // Move to top and replace in-place (immutably).
          return [updated, ...prev.slice(0, index), ...prev.slice(index + 1)];
        }
      );
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, isConnected, organizationId, queryClient]);

  /**
   * Filter conversations based on search query
   */
  const filteredConversations = (data || []).filter((conversation) => {
    const query = searchQuery.toLowerCase();

    if (!query) return true;

    // For group conversations, search by name
    if (conversation.is_group) {
      return (conversation.name || '').toLowerCase().includes(query);
    }

    // For direct messages, search by participant name
    const otherParticipant = conversation.participants.find(
      (p) => p.user_id !== currentUserId
    );

    if (!otherParticipant) {
      const fallbackName = (
        conversation.name || `Conversation ${conversation.id}`
      ).toLowerCase();
      return fallbackName.includes(query);
    }

    const fullName =
      `${otherParticipant.user.first_name} ${otherParticipant.user.last_name}`.toLowerCase();
    const email = otherParticipant.user.email.toLowerCase();

    return fullName.includes(query) || email.includes(query);
  });

  /**
   * Handle conversation selection
   */
  const handleSelectConversation = (conversationId: string) => {
    router.push(`?chat=${conversationId}`);
  };

  /**
   * Handle new chat creation
   */
  const handleChatCreated = (conversationId: string) => {
    // Switch to the newly created conversation
    router.push(`?chat=${conversationId}`);
  };

  /**
   * Get display name for conversation
   */
  const getConversationName = (conversation: Conversation): string => {
    if (conversation.is_group) {
      return conversation.name || t('groupChatFallback');
    }

    // For DMs, show the other user's name
    const otherParticipant = conversation.participants.find(
      (p) => p.user_id !== currentUserId
    );
    if (!otherParticipant) {
      return conversation.name || `Conversation ${conversation.id.slice(0, 8)}`;
    }

    return `${otherParticipant.user.first_name} ${otherParticipant.user.last_name}`;
  };

  /**
   * Get avatar initials for conversation
   */
  const getAvatarInitials = (conversation: Conversation): string => {
    if (conversation.is_group) {
      return (conversation.name || 'GC')
        .split(' ')
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase();
    }

    const otherParticipant = conversation.participants.find(
      (p) => p.user_id !== currentUserId
    );
    if (!otherParticipant) {
      return 'CV';
    }

    return `${otherParticipant.user.first_name[0]}${otherParticipant.user.last_name[0]}`.toUpperCase();
  };

  /**
   * Get the latest message snippet
   */
  const getLatestMessageSnippet = (
    conversation: Conversation
  ): { text: string; sender: string } | null => {
    if (!conversation.messages || conversation.messages.length === 0) {
      return null;
    }

    const latestMessage = conversation.messages[0];
    const snippet = latestMessage.content.substring(0, 50);

    const senderLabel =
      latestMessage.sender.first_name ||
      latestMessage.sender.email.split('@')[0] ||
      (latestMessage.sender_id ? t('unknownUser') : 'AI');

    return {
      text: snippet + (latestMessage.content.length > 50 ? '...' : ''),
      sender: senderLabel,
    };
  };

  if (error) {
    return (
      <div className="text-destructive flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium">{t('failedLoadConversations')}</p>
          <p className="text-muted-foreground text-xs">
            {error instanceof Error ? error.message : t('unknownError')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary flex h-full flex-col border-r">
      {/* Header */}
      <div className="border-border space-y-3 border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground font-semibold">{t('messages')}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setIsNewChatOpen(true)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title={t('startDirectMessage')}
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchConversations')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-primary/10 border-border placeholder:text-muted-foreground text-foreground focus:border-primary focus:ring-primary w-full rounded-lg border py-2 pr-3 pl-10 text-sm focus:ring-1 focus:outline-none"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="text-muted-foreground flex h-full items-center justify-center">
            <p className="text-sm">{t('loadingConversations')}</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-muted-foreground flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-sm font-medium">
                {data && data.length === 0
                  ? t('noConversationsYet')
                  : t('noResultsFound')}
              </p>
              {searchQuery && (
                <p className="text-xs">{t('tryDifferentSearch')}</p>
              )}
            </div>
          </div>
        ) : (
          <ul className="space-y-1 p-2">
            {filteredConversations.map((conversation) => {
              const isActive = activeConversationId === conversation.id;
              const latestMessage = getLatestMessageSnippet(conversation);
              const displayName = getConversationName(conversation);
              const avatarInitials = getAvatarInitials(conversation);

              return (
                <li key={conversation.id}>
                  <button
                    onClick={() => handleSelectConversation(conversation.id)}
                    className={cn(
                      'hover:bg-primary/10 focus:ring-primary w-full rounded-lg px-3 py-3 text-left transition-colors focus:ring-2 focus:outline-none',
                      isActive && 'bg-primary/20'
                    )}
                  >
                    <div className="flex gap-3">
                      {/* Avatar */}
                      <div
                        className={cn(
                          'bg-primary text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                          isActive && 'ring-primary ring-2 ring-offset-1'
                        )}
                      >
                        {avatarInitials}
                      </div>

                      {/* Conversation Info */}
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground truncate text-sm font-medium">
                          {displayName}
                        </p>
                        {latestMessage ? (
                          <p className="text-muted-foreground truncate text-xs">
                            <span className="font-medium">
                              {latestMessage.sender}:
                            </span>{' '}
                            {latestMessage.text}
                          </p>
                        ) : (
                          <p className="text-muted-foreground text-xs italic">
                            {t('noMessagesYet')}
                          </p>
                        )}

                        {/* Timestamp */}
                        <p className="text-muted-foreground mt-1 text-xs">
                          {new Date(
                            conversation.updated_at
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Unread indicator (optional) */}
                      {isActive && (
                        <div className="bg-primary h-2 w-2 shrink-0 rounded-full" />
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* New Chat Dialog */}
      <NewChatDialog
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onChatCreated={handleChatCreated}
      />
    </div>
  );
}
