'use client';

import { useMemo, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { z } from 'zod';
import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  translations: z.record(z.string(), z.optional(z.string())).optional(),
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
  const [activeTranslations, setActiveTranslations] = useState<string[]>([]);

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
  const watchedPermissions = watch('permissionIds');

  // Sync form when roleToEdit changes or sheet opens
  useEffect(() => {
    if (isOpen) {
      if (roleToEdit) {
        const translations = roleToEdit.name_translations ?? {};
        const activeLanguages = Object.keys(translations);

        reset({
          name: roleToEdit.name,
          translations,
          permissionIds:
            roleToEdit.rolePermissions?.map((rp) => rp.permission.id) ?? [],
        });

        setActiveTranslations(activeLanguages);
      } else {
        reset({
          name: '',
          translations: {},
          permissionIds: [],
        });

        setActiveTranslations([]);
      }
    }
  }, [isOpen, roleToEdit, reset]);

  // Determine if this is a system role (Owner or Admin) - these cannot be renamed
  const isSystemRole =
    roleToEdit?.name && ['Owner', 'Admin'].includes(roleToEdit.name);

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
    if (!activeTranslations.includes(languageCode)) {
      setActiveTranslations([...activeTranslations, languageCode]);
      // Initialize the form field for this language
      const currentTranslations = getValues('translations') ?? {};
      setValue('translations', {
        ...currentTranslations,
        [languageCode]: '',
      });
    }
  };

  // Handle removing a translation language
  const handleRemoveTranslation = (languageCode: string) => {
    setActiveTranslations(activeTranslations.filter((l) => l !== languageCode));
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
          {/* Role Name Input */}
          <div className="space-y-4">
            {/* Default Name (Turkish) */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="name">
                Role Name (Default / Turkish)
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
                <p className="text-destructive text-xs">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Translation Inputs */}
            {activeTranslations.length > 0 && (
              <div className="space-y-3">
                {activeTranslations.map((language) => {
                  const langLabel =
                    availableLanguages.find((l) => l.code === language)
                      ?.label || language;
                  return (
                    <div key={language} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label
                          className="text-sm font-medium"
                          htmlFor={`translation-${language}`}
                        >
                          Role Name ({langLabel})
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveTranslation(language)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                      <Input
                        id={`translation-${language}`}
                        {...register(`translations.${language}`)}
                        placeholder={`Role name in ${langLabel}`}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Translation Button */}
            {availableToAdd.length > 0 && (
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <span>➕</span>
                      Add Translation
                      <ChevronDown className="ml-auto h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {availableToAdd.map((lang) => (
                      <DropdownMenuItem
                        key={lang.code}
                        onClick={() => handleAddTranslation(lang.code)}
                      >
                        {lang.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
