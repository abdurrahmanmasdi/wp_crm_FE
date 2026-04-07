'use client';

import { useSearchParams } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { ConversationList } from '@/components/chat/ConversationList';
import { ActiveChat } from '@/components/chat/ActiveChat';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const activeConversationId = searchParams.get('chat');

  return (
    <div className="h-[calc(100vh-theme(spacing.16))] w-full">
      <div className="grid h-full grid-cols-1 gap-0 lg:grid-cols-[320px_1fr]">
        {/* Left Sidebar: Conversation List */}
        <aside className="hidden h-full overflow-hidden lg:block">
          <ConversationList />
        </aside>

        {/* Right Main Area: Chat Feed */}
        <main className="flex h-full max-h-[calc(100vh-65px)] flex-col">
          {activeConversationId ? (
            <ActiveChat conversationId={activeConversationId} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center">
              <MessageCircle className="text-muted-foreground/50 mb-4 h-16 w-16" />
              <h2 className="text-foreground mb-2 text-xl font-semibold">
                No conversation selected
              </h2>
              <p className="text-muted-foreground max-w-xs text-center">
                Select a conversation from the sidebar to start messaging
              </p>
            </div>
          )}
        </main>

        {/* Mobile: Show conversation list overlay or placeholder */}
        <div className="block h-full lg:hidden">
          {!activeConversationId ? (
            <ConversationList />
          ) : (
            <ActiveChat conversationId={activeConversationId} />
          )}
        </div>
      </div>
    </div>
  );
}
