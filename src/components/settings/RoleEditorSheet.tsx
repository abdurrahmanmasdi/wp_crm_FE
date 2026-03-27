'use client';

import { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { accessControlService } from '@/lib/access-control.service';
import { getErrorMessage } from '@/lib/error-utils';
import type { Permission, Role } from '@/types/access-control';
import {
  getResourcePrefix,
  formatResourceName,
} from '@/constants/permissions.registry';

// Validation schema
const roleFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .min(3, 'Name must be at least 3 characters'),
  permissionIds: z.array(z.string()).min(1, 'Select at least one permission'),
});

type RoleFormData = z.infer<typeof roleFormSchema>;

interface RoleEditorSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  roleToEdit?: Role | null;
  orgId: string;
}

// Helper function to group permissions by resource prefix
function groupPermissionsByResource(
  permissions: Permission[]
): Record<string, Permission[]> {
  const grouped: Record<string, Permission[]> = {};

  permissions.forEach((permission) => {
    // Use registry helper to extract resource prefix (e.g., "leads:read" -> "leads")
    const resourcePrefix = getResourcePrefix(permission.action);
    const resourceName = formatResourceName(resourcePrefix);

    if (!grouped[resourceName]) {
      grouped[resourceName] = [];
    }
    grouped[resourceName].push(permission);
  });

  return grouped;
}

export function RoleEditorSheet({
  isOpen,
  onOpenChange,
  roleToEdit,
  orgId,
}: RoleEditorSheetProps) {
  const queryClient = useQueryClient();
  const t = useTranslations('Settings.Roles');
  // Fetch all permissions
  const { data: permissionsData, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => accessControlService.getPermissions(),
  });

  // Group permissions by resource prefix using useMemo
  const groupedPermissions = useMemo(() => {
    const permissions = permissionsData?.data ?? [];
    return groupPermissionsByResource(permissions);
  }, [permissionsData?.data]);

  // Initialize form with empty values
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: '',
      permissionIds: [],
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const watchedPermissions = watch('permissionIds');

  // Sync form when roleToEdit changes or sheet opens
  useEffect(() => {
    if (isOpen) {
      if (roleToEdit) {
        reset({
          name: roleToEdit.name,
          permissionIds:
            roleToEdit.rolePermissions?.map((rp) => rp.permission.id) ?? [],
        });
      } else {
        reset({
          name: '',
          permissionIds: [],
        });
      }
    }
  }, [isOpen, roleToEdit, reset]);

  // Determine if this is a system role (Owner or Admin) - these cannot be renamed
  const isSystemRole =
    roleToEdit?.name && ['Owner', 'Admin'].includes(roleToEdit.name);

  // Mutation for creating a new role
  const createRoleMutation = useMutation({
    mutationFn: (data: RoleFormData) =>
      accessControlService.createRole(orgId, {
        name: data.name,
        permissionIds: data.permissionIds,
      }),
    onSuccess: () => {
      toast.success(t('roleCreateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['roles', orgId] });
      onOpenChange(false);
    },
    onError: (error) => {
      try {
        const errorMessage = getErrorMessage(error);
        toast.error(errorMessage || t('failedToCreateRole'));
      } catch {
        toast.error(t('unexpectedErrorCreating'));
      }
    },
  });

  // Mutation for updating an existing role
  const updateRoleMutation = useMutation({
    mutationFn: (data: RoleFormData) =>
      accessControlService.updateRole(orgId, roleToEdit!.id, {
        name: !isSystemRole ? data.name : undefined,
        permissionIds: data.permissionIds,
      }),
    onSuccess: () => {
      toast.success(t('roleUpdateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['roles', orgId] });
      onOpenChange(false);
    },
    onError: (error) => {
      try {
        const errorMessage = getErrorMessage(error);
        toast.error(errorMessage || t('failedToUpdateRole'));
      } catch {
        toast.error(t('unexpectedErrorUpdating'));
      }
    },
  });

  const onSubmit = (data: RoleFormData) => {
    if (roleToEdit) {
      updateRoleMutation.mutate(data);
    } else {
      createRoleMutation.mutate(data);
    }
  };

  const isPending =
    createRoleMutation.isPending || updateRoleMutation.isPending;
  const isLoading = isLoadingPermissions || isPending;

  // Handle permission checkbox change
  const handlePermissionChange = (
    permissionId: string,
    checked: boolean | 'indeterminate'
  ) => {
    if (checked === 'indeterminate') return;

    const isChecked = checked === true;
    const currentPermissions = watchedPermissions || [];

    if (isChecked) {
      // Add permission if not already present
      if (!currentPermissions.includes(permissionId)) {
        setValue('permissionIds', [...currentPermissions, permissionId]);
      }
    } else {
      // Remove permission
      setValue(
        'permissionIds',
        currentPermissions.filter((id) => id !== permissionId)
      );
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {roleToEdit ? t('editorEdit') : t('editorCreate')}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          {/* Role Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="name">
              {t('roleName')}
            </label>
            <Input
              id="name"
              {...register('name')}
              placeholder={t('rolePlaceholder')}
              disabled={Boolean(isSystemRole)}
              className={isSystemRole ? 'bg-muted cursor-not-allowed' : ''}
            />
            {isSystemRole && (
              <p className="text-muted-foreground text-xs">
                {t('systemRoleNotice')}
              </p>
            )}
            {errors.name && (
              <p className="text-destructive text-xs">{errors.name.message}</p>
            )}
          </div>

          {/* Grouped Permissions */}
          <div className="space-y-6">
            <div>
              <h3 className="mb-4 text-sm font-semibold">{t('permissions')}</h3>
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
                          {resourcePermissions.map((permission) => (
                            <div
                              key={permission.id}
                              className="flex flex-row items-start space-x-3"
                            >
                              <Checkbox
                                id={permission.id}
                                checked={Boolean(
                                  watchedPermissions?.includes(permission.id)
                                )}
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
                                  className="cursor-pointer text-sm font-normal"
                                >
                                  {permission.action}
                                </label>
                                {permission.description && (
                                  <p className="text-muted-foreground text-xs">
                                    {permission.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
              {errors.permissionIds && (
                <p className="text-destructive mt-2 text-xs">
                  {errors.permissionIds.message}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t('saving')}
                </>
              ) : (
                t('saveRole')
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
