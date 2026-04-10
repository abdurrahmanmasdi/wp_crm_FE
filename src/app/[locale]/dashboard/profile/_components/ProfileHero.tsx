'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ChevronDown, Pencil } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUsersControllerUpdateMembershipProfileV1 } from '@/api-generated/endpoints/users';
import { getUsersControllerGetPerformanceProfileV1QueryKey } from '@/api-generated/endpoints/users';
import type { UsersControllerGetPerformanceProfileV1200 } from '@/api-generated/model';
import {
  STATUS_CONFIG,
  TIER_CONFIG as TIER_MAPPING,
  type AvailabilityStatus,
} from './profile.constants';

interface UserData {
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string;
}

interface MembershipData {
  availability_status?: string;
  job_title?: string;
  agent_tier?: string;
}

interface ProfileHeroProps {
  data: UsersControllerGetPerformanceProfileV1200;
  isEditing?: boolean;
  onEditingChange?: (isEditing: boolean) => void;
}

/**
 * Get tier badge color based on agent tier
 */
const getTierBadgeVariant = (tier?: string) => {
  const tierConfig = TIER_MAPPING[tier as keyof typeof TIER_MAPPING];
  if (tierConfig) {
    return `${tierConfig.badgeColor} ${tierConfig.badgeTextColor}`;
  }
  return 'bg-slate-500 text-white';
};

/**
 * Get tier display label
 */
const getTierLabel = (tier?: string) => {
  const tierConfig = TIER_MAPPING[tier as keyof typeof TIER_MAPPING];
  return tierConfig?.label ?? 'Unassigned';
};

/**
 * ProfileHero Component
 * Displays user profile header with avatar, name, job title, agent tier badge, and status dropdown
 */
export function ProfileHero({
  data,
  isEditing = false,
  onEditingChange,
}: ProfileHeroProps) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFirstName, setEditFirstName] = useState<string>(
    (data?.user?.first_name as string | undefined) || ''
  );
  const [editLastName, setEditLastName] = useState<string>(
    (data?.user?.last_name as string | undefined) || ''
  );

  const user = data?.user as UserData | undefined;
  const membership = data?.membership as MembershipData | undefined;

  // Current availability status
  const status = (membership?.availability_status ||
    'ACTIVE') as AvailabilityStatus;
  const statusConfig = STATUS_CONFIG[status];

  // Mutation hook for updating membership profile
  const { mutate: updateProfile } =
    useUsersControllerUpdateMembershipProfileV1();

  /**
   * Handle status change from dropdown menu
   */
  const handleStatusChange = useCallback(
    (newStatus: AvailabilityStatus) => {
      setIsUpdating(true);

      updateProfile(
        {
          data: {
            availability_status: newStatus as any,
          },
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: getUsersControllerGetPerformanceProfileV1QueryKey(),
            });
            setIsUpdating(false);
          },
          onError: () => {
            setIsUpdating(false);
          },
        }
      );
    },
    [updateProfile, queryClient]
  );

  /**
   * Handle edit button toggle
   */
  const handleEditToggle = useCallback(() => {
    const newState = !isEditing;
    onEditingChange?.(newState);

    // Reset form fields when exiting edit mode
    if (isEditing) {
      setEditFirstName(user?.first_name || '');
      setEditLastName(user?.last_name || '');
    }
  }, [isEditing, onEditingChange, user]);

  // Get user initials for avatar fallback
  const initials = (() => {
    const firstName = isEditing ? editFirstName : user?.first_name;
    const lastName = isEditing ? editLastName : user?.last_name;

    if (
      firstName &&
      lastName &&
      typeof firstName === 'string' &&
      typeof lastName === 'string'
    ) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName && typeof firstName === 'string') {
      return firstName.charAt(0).toUpperCase();
    }
    return '?';
  })();

  // Get display name
  const displayName = (() => {
    if (isEditing) {
      return editFirstName && editLastName
        ? `${editFirstName} ${editLastName}`
        : 'Enter Name';
    }
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.email || 'Agent';
  })();

  // Get dot color based on status
  const getStatusDotColor = (statusKey: AvailabilityStatus) => {
    const config = STATUS_CONFIG[statusKey];
    // Convert Tailwind class to a simple color
    if (config?.color.includes('green')) return 'bg-green-500';
    if (config?.color.includes('blue')) return 'bg-blue-500';
    if (config?.color.includes('amber')) return 'bg-amber-500';
    if (config?.color.includes('gray')) return 'bg-gray-500';
    return 'bg-gray-500';
  };

  return (
    <div className="border-border relative rounded-2xl border bg-linear-to-br from-slate-900/50 via-slate-800/30 to-slate-900/20 p-6 backdrop-blur-md">
      {/* Background gradient accent */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header row with Edit button */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditToggle}
            className="gap-2 transition-colors hover:border-blue-500 hover:bg-blue-500/10"
          >
            <Pencil className="h-4 w-4" />
            {isEditing ? 'Done Editing' : 'Edit Profile'}
          </Button>
        </div>

        {/* Main content flex row */}
        <div className="flex items-start gap-8">
          {/* Left: Avatar and Name Section */}
          <div className="flex flex-1 items-start gap-6">
            {/* Avatar */}
            <Avatar className="h-24 w-24 shrink-0 border-2 border-blue-500/30 ring-2 ring-blue-500/10">
              <AvatarImage src={user?.avatar_url} alt={displayName} />
              <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-500 text-xl font-bold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Name and Job Title */}
            <div className="flex flex-1 flex-col gap-4">
              {/* Name Section */}
              {isEditing ? (
                <div className="flex gap-3">
                  <Input
                    placeholder="First Name"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="h-10 text-lg font-extrabold"
                  />
                  <Input
                    placeholder="Last Name"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="h-10 text-lg font-extrabold"
                  />
                </div>
              ) : (
                <h1 className="text-4xl leading-tight font-extrabold text-white">
                  {displayName}
                </h1>
              )}

              {/* Job Title and Tier */}
              <div className="flex items-center gap-3">
                <p className="text-muted-foreground text-sm">
                  {membership?.job_title || 'Sales Agent'}
                </p>
                {membership?.agent_tier && (
                  <Badge
                    className={`${getTierBadgeVariant(
                      membership.agent_tier
                    )} border`}
                  >
                    {getTierLabel(membership.agent_tier)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Right: Status Dropdown */}
          <div className="flex flex-col items-end gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="group gap-2 border-slate-700 hover:bg-slate-700/50"
                  disabled={isUpdating}
                >
                  {/* Status Chip with glowing dot */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex h-2 w-2">
                      <span
                        className={`absolute inline-flex h-full w-full rounded-full ${getStatusDotColor(
                          status
                        )} animate-pulse`}
                      />
                      <span
                        className={`relative inline-flex h-2 w-2 rounded-full ${getStatusDotColor(
                          status
                        )}`}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {statusConfig?.label || status}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50 transition-opacity group-hover:opacity-100" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {(
                  Object.entries(STATUS_CONFIG) as Array<
                    [
                      AvailabilityStatus,
                      (typeof STATUS_CONFIG)[AvailabilityStatus],
                    ]
                  >
                ).map(([statusKey, config]) => (
                  <DropdownMenuItem
                    key={statusKey}
                    onClick={() => handleStatusChange(statusKey)}
                    className="cursor-pointer gap-2"
                  >
                    <div className={`h-2 w-2 rounded-full ${config.color}`} />
                    <span>{config.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <p className="text-muted-foreground text-right text-xs">
              {statusConfig?.description ||
                t('dashboard.profile.active_for_leads')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
