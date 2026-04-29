'use client';

import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import type { Message } from '@/types/chat-generated';
import { useChatSocket } from '@/providers/ChatSocketProvider';
import { useAuthStore } from '@/store/useAuthStore';
import {
  conversationMessagesQueryKey,
  useChatHistoryQuery,
} from '@/hooks/useChat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Send } from 'lucide-react';

interface ActiveChatProps {
  conversationId: string;
}

/**
 * ActiveChat component that displays the chat message feed for a conversation
 * Listens to real-time WebSocket events and auto-scrolls to new messages
 */
export function ActiveChat({ conversationId }: ActiveChatProps) {
  const t = useTranslations('Chat');
  const queryClient = useQueryClient();
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get organization from auth store
  const organizationId = useAuthStore((state) => state.activeOrganizationId);

  // Get socket instance and connection status
  const { socket, isConnected } = useChatSocket();

  /**
   * Fetch historical messages for the conversation
   */
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatHistoryQuery(conversationId);

  const pagedMessages = useMemo(
    () => data?.pages.flatMap((page) => page) ?? [],
    [data?.pages]
  );

  // API returns newest-first; reverse for chat rendering (oldest at top, newest at bottom).
  const messages = useMemo(() => [...pagedMessages].reverse(), [pagedMessages]);

  /**
   * Auto-scroll to bottom when conversation changes.
   * On conversation switch, jump instantly to the newest message.
   */
  useEffect(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    });
  }, [conversationId]);

  /**
   * Setup WebSocket listeners for real-time messages.
   *
   * The backend emits a `new_message` event with the envelope shape:
   *   {
   *     type: "NEW_MESSAGE",
   *     organizationId: string,
   *     conversationId: string,
   *     message: {
   *       id: string,
   *       content: string,
   *       sender: "USER" | "AI",      // high-level role
   *       type?: string,              // e.g. AI_TEXT, USER_TEXT
   *       sender_id?: string,
   *       sender_name?: string,
   *       createdAt: string,
   *     }
   *   }
   *
   * We also keep backward-compat with raw `Message` objects emitted by
   * the previous socket implementation (where conversation_id was top-level).
   */
  useEffect(() => {
    if (!socket || !isConnected || !conversationId) {
      return;
    }

    // Join the conversation room so the server scopes events to us.
    socket.emit('join_conversation', { conversationId });
    console.log(`[ActiveChat] Joined conversation: ${conversationId}`);

    const handleNewMessage = (payload: unknown) => {
      // ── Normalise the incoming payload into a Message object ──────────────
      //
      // Two formats can arrive:
      //  A) Envelope: { type, organizationId, conversationId, message: {...} }
      //  B) Legacy raw Message object (conversation_id at root)
      let msg: Message | null = null;

      const raw = payload as Record<string, unknown>;

      if (raw.type === 'NEW_MESSAGE' && raw.message) {
        // Format A: envelope
        const env = raw.message as Record<string, unknown>;
        const envConversationId = String(raw.conversationId ?? '');
        if (envConversationId !== conversationId) return; // wrong room

        const isAiSender =
          String(env.sender ?? '').toUpperCase() === 'AI' ||
          String(env.type ?? '').startsWith('AI_');

        msg = {
          id: String(env.id ?? `ws-${Date.now()}`),
          conversation_id: envConversationId,
          sender_id: isAiSender ? '' : String(env.sender_id ?? ''),
          type: String(env.type ?? (isAiSender ? 'AI_TEXT' : 'USER_TEXT')),
          content: String(env.content ?? ''),
          created_at: String(
            env.createdAt ?? env.created_at ?? new Date().toISOString()
          ),
          updated_at: String(
            env.updatedAt ?? env.updated_at ?? new Date().toISOString()
          ),
          sender: {
            id: String(env.sender_id ?? ''),
            first_name: isAiSender
              ? 'AI'
              : (String(env.sender_name ?? '').split(' ')[0] ?? ''),
            last_name: isAiSender
              ? 'Assistant'
              : (String(env.sender_name ?? '')
                  .split(' ')
                  .slice(1)
                  .join(' ') ?? ''),
            email: '',
          },
        };
      } else if (typeof raw.conversation_id === 'string') {
        // Format B: legacy raw Message
        if (raw.conversation_id !== conversationId) return;
        msg = raw as unknown as Message;
      } else {
        // Unknown format — log and bail.
        console.warn('[ActiveChat] Unrecognised new_message payload:', payload);
        return;
      }

      console.log('[ActiveChat] New message received:', msg);

      // ── Write into the React Query infinite cache ─────────────────────────
      // Messages are stored newest-first in the API (index 0 = newest).
      // Prepend to the first page so the reversed render shows it at bottom.
      queryClient.setQueryData<InfiniteData<Message[], string | undefined>>(
        conversationMessagesQueryKey(organizationId, conversationId),
        (prev) => {
          if (!prev) {
            return { pages: [[msg!]], pageParams: [undefined] };
          }
          const firstPage = prev.pages[0] ?? [];
          // Dedup: ignore if already in cache (e.g. arrived via poll first)
          if (firstPage.some((m) => m.id === msg!.id)) return prev;
          return {
            ...prev,
            pages: [[msg!, ...firstPage], ...prev.pages.slice(1)],
          };
        }
      );

      // Snap to bottom immediately after the DOM updates.
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.emit('leave_conversation', { conversationId });
      console.log(`[ActiveChat] Left conversation: ${conversationId}`);
    };
  }, [socket, isConnected, conversationId, organizationId, queryClient]);

  /**
   * Handle sending a new message
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !socket || !isConnected || isSending) {
      return;
    }

    const messageContent = messageInput.trim();
    setMessageInput('');
    setIsSending(true);

    try {
      // Emit message through socket
      socket.emit('send_message', {
        conversationId,
        content: messageContent,
      });
      console.log('[ActiveChat] Message sent:', messageContent);
    } catch (error) {
      console.error('[ActiveChat] Failed to send message:', error);
      // Restore the input on error
      setMessageInput(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Get initials from user name
   */
  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0]?.toUpperCase() || '';
    const last = lastName?.[0]?.toUpperCase() || '';
    return first + last || '?';
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return t('justNow');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t('minutesAgo', { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('hoursAgo', { count: hours });
    const days = Math.floor(hours / 24);
    if (days < 7) return t('daysAgo', { count: days });

    return date.toLocaleDateString();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">
            {t('loadingMessages')}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-destructive text-sm font-medium">
            {t('failedLoadMessages')}
          </p>
          <p className="text-muted-foreground text-xs">{t('refreshPage')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex h-full flex-col">
      {/* Messages Container */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="flex flex-col gap-4 p-4">
          {hasNextPage ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('loadingOlderMessages')}
                  </>
                ) : (
                  t('loadOlderMessages')
                )}
              </Button>
            </div>
          ) : null}

          {messages.length === 0 ? (
            <div className="text-muted-foreground flex h-full items-center justify-center">
              <p className="text-sm">{t('startConversationPrompt')}</p>
            </div>
          ) : (
            messages.map((message) => {
              /**
               * Bubble ownership rules (type-based):
               *  - LEAD_TEXT, LEAD_VOICE, LEAD_TEXT → left side (patient/client)
               *  - AI_TEXT → right side (AI assistant)
               *  - AGENT_TEXT → right side (human clinic worker)
               */
              const msgType = message.type || 'USER_TEXT';
              const isClient =
                msgType === 'LEAD_TEXT' ||
                msgType === 'LEAD_VOICE' ||
                msgType === 'LEAD_TEXT';
              const isAI = msgType === 'AI_TEXT';
              const isAgent = msgType === 'AGENT_TEXT';
              const isOwn = isAgent; // Only agent messages are "yours"

              // Determine avatar label
              let avatarLabel = '?';
              if (isAI) {
                avatarLabel = '🤖';
              } else if (isAgent) {
                avatarLabel = getInitials(
                  message.sender.first_name,
                  message.sender.last_name
                );
              } else if (isClient) {
                avatarLabel = getInitials(
                  message.sender.first_name,
                  message.sender.last_name
                );
              }

              // Determine label text
              let labelText = 'Unknown';
              if (isClient) {
                labelText = 'Patient';
              } else if (isAI) {
                labelText = '🤖 AI Assistant';
              } else if (isAgent) {
                labelText = '👤 You (Agent)';
              }

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback
                      className={`text-xs ${
                        isAI
                          ? 'bg-violet-500/20 text-violet-300'
                          : isOwn
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {avatarLabel}
                    </AvatarFallback>
                  </Avatar>

                  {/* Message Bubble */}
                  <div
                    className={`flex flex-col gap-1 ${
                      isOwn ? 'items-end' : 'items-start'
                    }`}
                  >
                    {/* Sender Label (above bubble) */}
                    <span className="text-muted-foreground text-xs font-medium">
                      {labelText}
                    </span>

                    {/* Message Content Bubble */}
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        isOwn
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : isAI
                            ? 'rounded-bl-sm bg-violet-500/10 text-violet-100 ring-1 ring-violet-500/20'
                            : 'bg-muted text-foreground rounded-bl-sm'
                      }`}
                    >
                      <p className="max-w-md text-sm wrap-break-word">
                        {message.content}
                      </p>
                    </div>

                    {/* Timestamp (below bubble) */}
                    <span className="text-muted-foreground text-xs">
                      {formatTimeAgo(message.created_at)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="bg-background border-t p-4">
        {!isConnected && (
          <div className="mb-2 rounded bg-amber-50 p-2 text-xs text-amber-700">
            {t('connecting')}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder={t('typeMessage')}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            disabled={!isConnected || isSending}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={
              !messageInput.trim() ||
              !isConnected ||
              isSending ||
              isLoading ||
              isFetchingNextPage
            }
            size="icon"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
