'use client';

import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { type Message } from '@/lib/chat.service';
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
  const hasAutoScrolledRef = useRef<string | null>(null);

  // Get current user from auth store
  const currentUserId = useAuthStore((state) => state.user?.id);

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
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    if (hasAutoScrolledRef.current === conversationId) {
      return;
    }

    hasAutoScrolledRef.current = conversationId;
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    });
  }, [conversationId, messages.length]);

  useEffect(() => {
    hasAutoScrolledRef.current = null;
  }, [conversationId]);

  /**
   * Setup WebSocket listeners for real-time messages
   */
  useEffect(() => {
    if (!socket || !isConnected || !conversationId) {
      return;
    }

    // Join the conversation room
    socket.emit('join_conversation', { conversationId });
    console.log(`[ActiveChat] Joined conversation: ${conversationId}`);

    // Listen for new messages
    const handleNewMessage = (message: Message) => {
      if (message.conversation_id !== conversationId) {
        return;
      }

      console.log('[ActiveChat] New message received:', message);
      queryClient.setQueryData<InfiniteData<Message[], string | undefined>>(
        conversationMessagesQueryKey(conversationId),
        (previousData) => {
          if (!previousData) {
            return {
              pages: [[message]],
              pageParams: [undefined],
            };
          }

          const firstPage = previousData.pages[0] ?? [];
          if (firstPage.some((item) => item.id === message.id)) {
            return previousData;
          }

          return {
            ...previousData,
            pages: [[message, ...firstPage], ...previousData.pages.slice(1)],
          };
        }
      );

      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    };

    socket.on('new_message', handleNewMessage);

    /**
     * Cleanup: Leave conversation and remove listener
     */
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.emit('leave_conversation', { conversationId });
      console.log(`[ActiveChat] Left conversation: ${conversationId}`);
    };
  }, [socket, isConnected, conversationId, queryClient]);

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
              const isOwn = message.sender_id === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs">
                      {getInitials(
                        message.sender.first_name,
                        message.sender.last_name
                      )}
                    </AvatarFallback>
                  </Avatar>

                  {/* Message Bubble */}
                  <div
                    className={`flex flex-col gap-1 ${
                      isOwn ? 'items-end' : 'items-start'
                    }`}
                  >
                    {/* Sender Name & Timestamp */}
                    <div className="text-muted-foreground flex gap-2 text-xs">
                      {!isOwn && (
                        <span className="font-medium">
                          {message.sender.first_name} {message.sender.last_name}
                        </span>
                      )}
                      <span>{formatTimeAgo(message.created_at)}</span>
                    </div>

                    {/* Message Content */}
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <p className="max-w-md text-sm wrap-break-word">
                        {message.content}
                      </p>
                    </div>
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
