'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createConversation } from '@/lib/api/chat';
import { orgService } from '@/lib/org.service';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Search } from 'lucide-react';

interface NewChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (conversationId: string) => void;
}

/**
 * NewChatDialog Component
 * Allows users to create a new 1-on-1 conversation by selecting from organization members
 */
export function NewChatDialog({
  isOpen,
  onClose,
  onChatCreated,
}: NewChatDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Get current user and organization
  const currentUser = useAuthStore((state) => state.user);
  const organizationId = useAuthStore((state) => state.activeOrganizationId);
  const currentUserId =
    currentUser && typeof currentUser === 'object' && 'id' in currentUser
      ? (currentUser as { id: string }).id
      : null;

  /**
   * Fetch all members of the organization
   */
  const { data: members, isLoading: isMembersLoading } = useQuery({
    queryKey: ['organization-members', organizationId],
    queryFn: () =>
      organizationId ? orgService.getOrganizationMembers(organizationId) : null,
    enabled: !!organizationId && isOpen,
  });

  /**
   * Create conversation mutation
   */
  const createConversationMutation = useMutation({
    mutationFn: createConversation,
    onSuccess: (conversation) => {
      // Invalidate conversations list so it updates
      queryClient.invalidateQueries({ queryKey: ['conversations'] });

      // Call the callback to switch to the new conversation
      onChatCreated(conversation.id);

      // Close the dialog
      onClose();

      // Reset search
      setSearchQuery('');
    },
  });

  /**
   * Filter members based on search query
   * Exclude current user
   */
  const filteredMembers = useMemo(() => {
    const data = members?.data;
    if (!data) return [];

    return data.filter((member) => {
      // Exclude current user
      if (member.user.id === currentUserId) return false;

      // Filter by name or email
      const query = searchQuery.toLowerCase();
      const fullName =
        `${member.user.firstName} ${member.user.lastName}`.toLowerCase();
      const email = member.user.email.toLowerCase();

      return fullName.includes(query) || email.includes(query);
    });
  }, [members, searchQuery, currentUserId]);

  /**
   * Handle member selection
   */
  const handleSelectMember = (memberId: string) => {
    createConversationMutation.mutate(memberId);
  };

  /**
   * Get initials from user name
   */
  const getInitials = (firstName: string, lastName: string): string => {
    return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Chat</DialogTitle>
          <DialogDescription>
            Select a team member to start a new conversation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              disabled={
                isMembersLoading || createConversationMutation.isPending
              }
            />
          </div>

          {/* Members List */}
          <div className="max-h-96 overflow-y-auto">
            {isMembersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center text-sm">
                {searchQuery
                  ? 'No members found matching your search'
                  : 'No team members available'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMembers.map((member) => (
                  <Button
                    key={member.user.id}
                    variant="ghost"
                    className="h-auto w-full justify-start px-2 py-2"
                    onClick={() => handleSelectMember(member.user.id)}
                    disabled={createConversationMutation.isPending}
                  >
                    <Avatar className="mr-3 h-10 w-10">
                      <AvatarFallback>
                        {getInitials(
                          member.user.firstName,
                          member.user.lastName
                        )}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">
                        {member.user.firstName} {member.user.lastName}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {member.user.email}
                      </div>
                    </div>

                    {createConversationMutation.isPending &&
                      createConversationMutation.variables ===
                        member.user.id && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
