'use client';

import { useMemo, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
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
import { RolePermissionGroups } from '@/components/settings/role-editor/RolePermissionGroups';
import { RoleTranslationFields } from '@/components/settings/role-editor/RoleTranslationFields';
import { queryKeys } from '@/lib/query-keys';

// Validation schema
const roleFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .min(3, 'Name must be at least 3 characters'),
  translations: z.record(z.string(), z.optional(z.string())).optional(),
  permissionIds: z.array(z.string()).min(1, 'Select at least one permission'),
});

export type RoleFormData = z.infer<typeof roleFormSchema>;

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
    queryKey: queryKeys.permissions.all(),
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
    control,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: '',
      translations: {},
      permissionIds: [],
    },
  });

  // Watch permission IDs for form state updates
  const watchedPermissions = useWatch({ control, name: 'permissionIds' }) ?? [];
  const watchedTranslations = useWatch({ control, name: 'translations' });
  const activeTranslations = Object.keys(watchedTranslations ?? {});

  // Sync form when roleToEdit changes or sheet opens
  useEffect(() => {
    if (isOpen) {
      if (roleToEdit) {
        const translations = roleToEdit.name_translations ?? {};

        reset({
          name: roleToEdit.name,
          translations,
          permissionIds:
            roleToEdit.rolePermissions?.map((rp) => rp.permission.id) ?? [],
        });
      } else {
        reset({
          name: '',
          translations: {},
          permissionIds: [],
        });
      }
    }
  }, [isOpen, roleToEdit, reset]);

  // Determine if this is a system role (owner/admin) - these cannot be renamed.
  const isSystemRole =
    roleToEdit?.slug === 'owner' || roleToEdit?.slug === 'admin';

  // Mutation for creating a new role
  const createRoleMutation = useMutation({
    mutationFn: (data: RoleFormData) => {
      // Build name_translations from form data, filtering out empty values
      const name_translations: Record<string, string> = {};
      if (data.translations) {
        Object.entries(data.translations).forEach(([lang, value]) => {
          if (value && value.trim()) {
            name_translations[lang] = value;
          }
        });
      }

      return accessControlService.createRole(orgId, {
        name: data.name,
        ...(Object.keys(name_translations).length > 0 && {
          name_translations,
        }),
        permissionIds: data.permissionIds,
      });
    },
    onSuccess: () => {
      toast.success(t('roleCreateSuccess'));
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all(orgId) });
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
    mutationFn: (data: RoleFormData) => {
      // Build name_translations from form data, filtering out empty values
      const name_translations: Record<string, string> = {};
      if (data.translations) {
        Object.entries(data.translations).forEach(([lang, value]) => {
          if (value && value.trim()) {
            name_translations[lang] = value;
          }
        });
      }

      return accessControlService.updateRole(orgId, roleToEdit!.id, {
        name: !isSystemRole ? data.name : undefined,
        ...(Object.keys(name_translations).length > 0 && {
          name_translations,
        }),
        permissionIds: data.permissionIds,
      });
    },
    onSuccess: () => {
      toast.success(t('roleUpdateSuccess'));
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all(orgId) });
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

  // Define available translation languages
  const availableLanguages = [
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية (Arabic)' },
  ];

  // Get languages that are not yet added
  const availableToAdd = availableLanguages.filter(
    (lang) => !activeTranslations.includes(lang.code)
  );

  // Handle adding a new translation language
  const handleAddTranslation = (languageCode: string) => {
    if (activeTranslations.includes(languageCode)) return;

    // Initialize the form field for this language
    const currentTranslations = getValues('translations') ?? {};
    setValue('translations', {
      ...currentTranslations,
      [languageCode]: '',
    });
  };

  // Handle removing a translation language
  const handleRemoveTranslation = (languageCode: string) => {
    const currentTranslations = getValues('translations') ?? {};
    const updated = { ...currentTranslations };
    delete updated[languageCode];
    setValue('translations', updated);
  };

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
          <RoleTranslationFields
            register={register}
            errors={errors}
            isSystemRole={Boolean(isSystemRole)}
            activeTranslations={activeTranslations}
            availableLanguages={availableLanguages}
            availableToAdd={availableToAdd}
            onAddTranslation={handleAddTranslation}
            onRemoveTranslation={handleRemoveTranslation}
            rolePlaceholder={t('rolePlaceholder')}
            systemRoleNotice={t('systemRoleNotice')}
          />

          {/* Grouped Permissions */}
          <RolePermissionGroups
            groupedPermissions={groupedPermissions}
            watchedPermissions={watchedPermissions}
            onPermissionChange={handlePermissionChange}
            isLoadingPermissions={isLoadingPermissions}
            permissionError={errors.permissionIds?.message}
          />

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
