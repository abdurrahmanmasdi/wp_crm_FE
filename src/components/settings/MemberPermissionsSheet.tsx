'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { accessControlService } from '@/lib/access-control.service';

import type { OrganizationMember, Permission } from '@/types/access-control';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { getErrorMessage } from '@/lib/error-utils';
import { useAuthStore } from '@/store/useAuthStore';
import {
  getResourcePrefix,
  formatResourceName,
} from '@/constants/permissions.registry';
import { queryKeys } from '@/lib/query-keys';

interface MemberPermissionsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  member: OrganizationMember | null;
}

interface PermissionFormData {
  permissionIds: string[];
}

export function MemberPermissionsSheet({
  isOpen,
  onOpenChange,
  member,
}: MemberPermissionsSheetProps) {
  const t = useTranslations('Settings.MemberPermissions');
  const orgId = useAuthStore((state) => state.activeOrganizationId);
  const queryClient = useQueryClient();
  const [selectedOverrideIds, setSelectedOverrideIds] = useState<string[]>([]);

  const { watch, setValue, reset, handleSubmit } = useForm<PermissionFormData>({
    defaultValues: {
      permissionIds: [],
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const _watchedPermissions = watch('permissionIds');

  // Fetch permissions
  const { data: permissionsData, isLoading: isLoadingPermissions } = useQuery({
    queryKey: queryKeys.permissions.all(),
    queryFn: () => accessControlService.getPermissions(),
    enabled: isOpen,
  });

  // Fetch permission breakdown (role vs overrides)
  const { data: breakdownData, isLoading: isLoadingBreakdown } = useQuery({
    queryKey: queryKeys.permissions.breakdown(orgId, member?.membershipId),
    queryFn: () => {
      if (!orgId || !member) {
        return Promise.resolve(null);
      }
      return accessControlService.getMemberPermissionBreakdown(
        orgId,
        member.membershipId
      );
    },
    enabled: isOpen && !!member && !!orgId,
  });

  const breakdown = breakdownData?.data;

  // Group permissions by resource (prefix)
  const groupedPermissions = useMemo(() => {
    if (!permissionsData?.data) return {};

    const grouped: Record<string, Permission[]> = {};

    permissionsData.data.forEach((permission) => {
      // Use registry helper to extract resource prefix (e.g., "leads:read" -> "leads")
      const resourcePrefix = getResourcePrefix(permission.action);
      const resourceName = formatResourceName(resourcePrefix);

      if (!grouped[resourceName]) {
        grouped[resourceName] = [];
      }
      grouped[resourceName].push(permission);
    });

    return grouped;
  }, [permissionsData]);

  // Sync form when sheet opens and breakdown loads
  useEffect(() => {
    if (isOpen && breakdown) {
      // Initialize the selected overrides from the breakdown data
      setSelectedOverrideIds(breakdown.grantedOverrideIds);
      reset({
        permissionIds: breakdown.grantedOverrideIds,
      });
    }
  }, [isOpen, breakdown, reset]);

  // Mutation for assigning permission overrides
  const assignPermissionMutation = useMutation({
    mutationFn: async (
      permissions: { permissionId: string; isGranted: boolean }[]
    ) => {
      if (!member || !orgId) throw new Error('Missing member or organization');

      // Batch all permission assignments
      return Promise.all(
        permissions.map((p) =>
          accessControlService.createPermissionOverride(
            orgId,
            member.membershipId,
            {
              permission_id: p.permissionId,
              is_granted: p.isGranted,
            }
          )
        )
      );
    },
    onSuccess: () => {
      toast.success(t('permissionsUpdatedSuccess'));
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.members(orgId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.permissions.breakdown(orgId, member?.membershipId),
      });
      onOpenChange(false);
    },
    onError: (error) => {
      try {
        const errorMessage = getErrorMessage(error);
        toast.error(errorMessage || t('failedToUpdatePermissions'));
      } catch {
        toast.error(t('unexpectedErrorUpdating'));
      }
    },
  });

  const handlePermissionChange = (
    permissionId: string,
    checked: boolean | 'indeterminate'
  ) => {
    if (checked === 'indeterminate') return;

    // Don't allow changing inherited permissions
    const isInherited = breakdown?.rolePermissionIds.includes(permissionId);
    if (isInherited) return;

    const isChecked = checked === true;
    const currentOverrides = selectedOverrideIds || [];

    if (isChecked) {
      // Add override if not already present
      if (!currentOverrides.includes(permissionId)) {
        setSelectedOverrideIds([...currentOverrides, permissionId]);
        setValue('permissionIds', [...currentOverrides, permissionId]);
      }
    } else {
      // Remove override
      const updated = currentOverrides.filter((id) => id !== permissionId);
      setSelectedOverrideIds(updated);
      setValue('permissionIds', updated);
    }
  };

  const onSubmit = async (data: PermissionFormData) => {
    if (!member || !breakdown) return;

    const previousOverrides = breakdown.grantedOverrideIds;
    const newOverrides = data.permissionIds;

    // Find new overrides (were not previously granted)
    const addedOverrides = newOverrides.filter(
      (id) => !previousOverrides.includes(id)
    );

    // Find removed overrides (were previously granted but no longer selected)
    const removedOverrides = previousOverrides.filter(
      (id) => !newOverrides.includes(id)
    );

    // Build permission changes list
    const permissionChanges = [
      ...addedOverrides.map((permissionId) => ({
        permissionId,
        isGranted: true,
      })),
      ...removedOverrides.map((permissionId) => ({
        permissionId,
        isGranted: false,
      })),
    ];

    // Only call mutation if there are actual changes
    if (permissionChanges.length > 0) {
      assignPermissionMutation.mutate(permissionChanges);
    } else {
      onOpenChange(false);
    }
  };

  const isPending = assignPermissionMutation.isPending;
  const isLoading = isLoadingPermissions || isLoadingBreakdown || isPending;

  if (!member) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('title', { name: member.user.firstName })}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          {/* Grouped Permissions */}
          <div className="space-y-6">
            <div>
              <h3 className="mb-4 text-sm font-semibold">
                {t('permissionsLabel')}
              </h3>
              {isLoadingPermissions ? (
                <p className="text-muted-foreground text-sm">
                  {t('loadingPermissions')}
                </p>
              ) : Object.entries(groupedPermissions).length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {t('noPermissions')}
                </p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedPermissions)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([resourceName, resourcePermissions]) => (
                      <div key={resourceName}>
                        {/* Resource Group Header */}
                        <h4 className="text-foreground mb-3 text-sm font-medium">
                          {resourceName}
                        </h4>

                        {/* Permission Checkboxes Grid */}
                        <div className="grid grid-cols-2 gap-3 pl-2">
                          {resourcePermissions.map((permission) => {
                            const isInherited =
                              breakdown?.rolePermissionIds.includes(
                                permission.id
                              );
                            const isOverride = selectedOverrideIds.includes(
                              permission.id
                            );

                            return (
                              <div
                                key={permission.id}
                                className="flex flex-row items-start space-x-3"
                              >
                                <Checkbox
                                  id={permission.id}
                                  checked={isInherited || isOverride}
                                  disabled={isInherited}
                                  onCheckedChange={(checked) => {
                                    handlePermissionChange(
                                      permission.id,
                                      checked
                                    );
                                  }}
                                  className="mt-1"
                                />
                                <div className="flex flex-col space-y-1">
                                  <label
                                    htmlFor={permission.id}
                                    className={`text-sm font-normal ${
                                      isInherited
                                        ? 'text-muted-foreground cursor-not-allowed'
                                        : 'cursor-pointer'
                                    }`}
                                  >
                                    {permission.action}
                                    {isInherited && (
                                      <span className="text-muted-foreground ml-2 text-xs">
                                        {t('fromRole')}
                                      </span>
                                    )}
                                  </label>
                                  {permission.description && (
                                    <p className="text-muted-foreground text-xs">
                                      {permission.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isPending ? t('saving') : t('saveOverrides')}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
