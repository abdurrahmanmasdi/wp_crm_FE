'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { createGroupConversation } from '@/lib/api/chat';
import { getOrganizationMembers } from '@/lib/api/organization';
import { queryKeys } from '@/lib/query-keys';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Search } from 'lucide-react';

interface NewGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (conversationId: string) => void;
}

/**
 * NewGroupDialog Component
 * Allows users to create a new group conversation
 */
export function NewGroupDialog({
  isOpen,
  onClose,
  onChatCreated,
}: NewGroupDialogProps) {
  const t = useTranslations('Chat');
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
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
    queryKey: queryKeys.organizations.members(organizationId),
    queryFn: () =>
      organizationId ? getOrganizationMembers(organizationId) : [],
    enabled: !!organizationId && isOpen,
  });

  /**
   * Create group conversation mutation
   */
  const createGroupMutation = useMutation({
    mutationFn: createGroupConversation,
    onSuccess: (conversation) => {
      // Invalidate conversations list so it updates
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.conversations(organizationId),
      });

      // Call the callback to switch to the new conversation
      onChatCreated(conversation.id);

      // Close the dialog and reset state
      onClose();
      setGroupName('');
      setSelectedUserIds([]);
      setSearchQuery('');
    },
  });

  /**
   * Filter members based on search query
   * Exclude current user
   */
  const filteredMembers = useMemo(() => {
    const data = members ?? [];
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
   * Handle member checkbox toggle
   */
  const handleToggleMember = (memberId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupName.trim() || selectedUserIds.length === 0) {
      return;
    }

    createGroupMutation.mutate({
      name: groupName,
      participantIds: selectedUserIds,
    });
  };

  /**
   * Get initials from user name
   */
  const getInitials = (firstName: string, lastName: string): string => {
    return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase();
  };

  /**
   * Check if submit button should be disabled
   */
  const isSubmitDisabled =
    !groupName.trim() ||
    selectedUserIds.length === 0 ||
    createGroupMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>{t('newGroupTitle')}</DialogTitle>
          <DialogDescription>{t('newGroupDescription')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group Name Input */}
          <div>
            <label
              htmlFor="group-name"
              className="text-foreground mb-2 block text-sm font-medium"
            >
              {t('groupName')}
            </label>
            <Input
              id="group-name"
              placeholder={t('groupNamePlaceholder')}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              disabled={isMembersLoading || createGroupMutation.isPending}
            />
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder={t('searchByNameOrEmail')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              disabled={isMembersLoading || createGroupMutation.isPending}
            />
          </div>

          {/* Members List with Checkboxes */}
          <div className="max-h-64 overflow-y-auto rounded-lg border">
            {isMembersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center text-sm">
                {searchQuery ? t('noMembersFound') : t('noTeamMembers')}
              </div>
            ) : (
              <div className="space-y-0">
                {filteredMembers.map((member) => (
                  <label
                    key={member.user.id}
                    className="hover:bg-secondary flex cursor-pointer items-center gap-3 border-b px-3 py-3 transition-colors last:border-b-0"
                  >
                    <Checkbox
                      checked={selectedUserIds.includes(member.user.id)}
                      onCheckedChange={() => handleToggleMember(member.user.id)}
                      disabled={createGroupMutation.isPending}
                    />

                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {getInitials(
                          member.user.firstName,
                          member.user.lastName
                        )}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">
                        {member.user.firstName} {member.user.lastName}
                      </div>
                      <div className="text-muted-foreground truncate text-xs">
                        {member.user.email}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Selected count */}
          {selectedUserIds.length > 0 && (
            <p className="text-muted-foreground text-xs">
              {selectedUserIds.length === 1
                ? t('memberSelectedOne')
                : t('memberSelectedMany', { count: selectedUserIds.length })}
            </p>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
            {createGroupMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t('createGroup')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
