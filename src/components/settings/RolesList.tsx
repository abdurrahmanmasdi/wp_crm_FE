'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RoleEditorSheet } from './RoleEditorSheet';
import { deleteRole, getRoles } from '@/lib/api/access-control';
import { getErrorMessage } from '@/lib/error-utils';
import { queryKeys } from '@/lib/query-keys';
import { getLocalizedRoleName } from '@/lib/utils/translations';
import type { Role } from '@/types/access-control-generated';
import { useAuthStore } from '@/store/useAuthStore';
import { RequirePermission } from '@/components/auth/RequirePermission';
import { AppResource, AppAction } from '@/constants/permissions.registry';

export function RolesList() {
  const activeOrganizationId = useAuthStore(
    (state) => state.activeOrganizationId
  );
  const queryClient = useQueryClient();
  const t = useTranslations('Settings.Roles');
  const locale = useLocale();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Fetch roles for the organization
  const {
    data: rolesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.roles.all(activeOrganizationId),
    queryFn: () =>
      activeOrganizationId
        ? getRoles(activeOrganizationId)
        : Promise.resolve([]),
    enabled: !!activeOrganizationId,
  });

  const roles = rolesData ?? [];

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) =>
      activeOrganizationId
        ? deleteRole(activeOrganizationId, roleId)
        : Promise.reject(new Error('No organization selected')),
    onSuccess: () => {
      toast.success(t('deleteSuccess'));
      queryClient.invalidateQueries({
        queryKey: queryKeys.roles.all(activeOrganizationId),
      });
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
    },
  });

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsEditorOpen(true);
  };

  const handleCreateNewRole = () => {
    setSelectedRole(null);
    setIsEditorOpen(true);
  };

  const handleDeleteRole = (role: Role) => {
    if (!window.confirm(t('deleteConfirm', { name: role.name }))) {
      return;
    }
    deleteRoleMutation.mutate(role.id);
  };

  const isSystemRole = (roleSlug?: string) => {
    return roleSlug === 'owner' || roleSlug === 'admin';
  };

  if (error) {
    return (
      <section className="bg-card rounded-2xl border border-white/5 p-8 shadow-2xl shadow-black/20">
        <div className="bg-background flex min-h-60 items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 px-6 text-center">
          <div className="max-w-md space-y-3">
            <p className="text-xs font-bold tracking-[0.2em] text-red-400 uppercase">
              {t('errorLabel')}
            </p>
            <h2 className="text-foreground text-xl font-semibold">
              {t('failedToLoad')}
            </h2>
            <p className="text-muted-foreground text-sm leading-6">
              {getErrorMessage(error)}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="bg-card rounded-2xl border border-white/5 p-8 shadow-2xl shadow-black/20">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-foreground text-lg font-semibold">
              {t('title')}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {t('subtitle')}
            </p>
          </div>
          <RequirePermission
            resource={AppResource.ROLES}
            action={AppAction.CREATE}
            fallback="disable"
          >
            <Button onClick={handleCreateNewRole} className="gap-2">
              <span>+</span>
              {t('editorCreate')}
            </Button>
          </RequirePermission>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="bg-background flex items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 px-6 py-12">
            <p className="text-muted-foreground text-sm">{t('loading')}</p>
          </div>
        ) : roles.length === 0 ? (
          <div className="bg-background flex min-h-40 items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 px-6 text-center">
            <div className="max-w-md space-y-2">
              <p className="text-muted-foreground text-sm">{t('noRoles')}</p>
              <p className="text-muted-foreground/70 text-xs">
                {t('noRolesHint')}
              </p>
            </div>
          </div>
        ) : (
          /* Roles Table */
          <div className="bg-background overflow-x-auto rounded-lg border border-white/5">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">
                    {t('tableHeaders.roleName')}
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    {t('tableHeaders.permissions')}
                  </TableHead>
                  <TableHead className="text-muted-foreground text-right">
                    {t('tableHeaders.actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow
                    key={role.id}
                    className="border-white/5 hover:bg-white/5"
                  >
                    <TableCell className="text-foreground font-medium">
                      {getLocalizedRoleName(role, locale)}
                      {isSystemRole(role.slug) && (
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary ml-2"
                        >
                          {t('systemBadge')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-primary/30 text-primary"
                      >
                        {role.rolePermissions?.length ?? 0} permission
                        {(role.rolePermissions?.length ?? 0) !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <RequirePermission
                          resource={AppResource.ROLES}
                          action={AppAction.EDIT}
                          fallback="disable"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={
                              isSystemRole(role.slug) ||
                              deleteRoleMutation.isPending
                            }
                            onClick={() => handleEditRole(role)}
                            className="text-muted-foreground hover:text-foreground border-white/10"
                          >
                            {t('edit')}
                          </Button>
                        </RequirePermission>
                        <RequirePermission
                          resource={AppResource.ROLES}
                          action={AppAction.DELETE}
                          fallback="disable"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRole(role)}
                            disabled={
                              isSystemRole(role.slug) ||
                              deleteRoleMutation.isPending
                            }
                            className={`border-white/10 ${
                              isSystemRole(role.slug)
                                ? 'cursor-not-allowed opacity-50'
                                : 'text-red-400 hover:text-red-300'
                            }`}
                          >
                            {deleteRoleMutation.isPending ? (
                              <>
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                {t('deleting')}
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4" />
                                {t('delete')}
                              </>
                            )}
                          </Button>
                        </RequirePermission>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Role Editor Sheet */}
      <RoleEditorSheet
        isOpen={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        roleToEdit={selectedRole}
        orgId={activeOrganizationId ?? ''}
      />
    </>
  );
}
