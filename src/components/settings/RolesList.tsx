'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { accessControlService } from '@/lib/access-control.service';
import { getErrorMessage } from '@/lib/error-utils';
import type { Role } from '@/types/access-control';
import { useAuthStore } from '@/store/useAuthStore';

export function RolesList() {
  const activeOrganizationId = useAuthStore(
    (state) => state.activeOrganizationId
  );
  const queryClient = useQueryClient();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Fetch roles for the organization
  const {
    data: rolesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['roles', activeOrganizationId],
    queryFn: () =>
      activeOrganizationId
        ? accessControlService.getRoles(activeOrganizationId)
        : Promise.resolve({ data: [] }),
    enabled: !!activeOrganizationId,
  });

  const roles = rolesData?.data ?? [];

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) =>
      activeOrganizationId
        ? accessControlService.deleteRole(activeOrganizationId, roleId)
        : Promise.reject(new Error('No organization selected')),
    onSuccess: () => {
      toast.success('Role deleted successfully');
      queryClient.invalidateQueries({
        queryKey: ['roles', activeOrganizationId],
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
    if (
      !window.confirm(
        `Are you sure you want to delete the role "${role.name}"?`
      )
    ) {
      return;
    }
    deleteRoleMutation.mutate(role.id);
  };

  const isSystemRole = (roleName: string) => {
    return ['Owner', 'Admin'].includes(roleName);
  };

  if (error) {
    return (
      <section className="rounded-2xl border border-white/5 bg-[#161b22] p-8 shadow-2xl shadow-black/20">
        <div className="flex min-h-60 items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-[#0a0e14] px-6 text-center">
          <div className="max-w-md space-y-3">
            <p className="text-xs font-bold tracking-[0.2em] text-red-400 uppercase">
              Error
            </p>
            <h2 className="text-xl font-semibold text-[#dfe2eb]">
              Failed to load roles
            </h2>
            <p className="text-sm leading-6 text-[#bacac5]">
              {getErrorMessage(error)}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="rounded-2xl border border-white/5 bg-[#161b22] p-8 shadow-2xl shadow-black/20">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#dfe2eb]">
              Roles & Permissions
            </h2>
            <p className="mt-1 text-sm text-[#bacac5]">
              Manage organization roles and their permissions
            </p>
          </div>
          <Button onClick={handleCreateNewRole} className="gap-2">
            <span>+</span>
            Create New Role
          </Button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-[#0a0e14] px-6 py-12">
            <p className="text-sm text-[#bacac5]">Loading roles...</p>
          </div>
        ) : roles.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-[#0a0e14] px-6 text-center">
            <div className="max-w-md space-y-2">
              <p className="text-sm text-[#bacac5]">No roles created yet.</p>
              <p className="text-xs text-[#8b949e]">
                Create your first role to get started
              </p>
            </div>
          </div>
        ) : (
          /* Roles Table */
          <div className="overflow-x-auto rounded-lg border border-white/5 bg-[#0a0e14]">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-[#bacac5]">Role Name</TableHead>
                  <TableHead className="text-[#bacac5]">Permissions</TableHead>
                  <TableHead className="text-right text-[#bacac5]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow
                    key={role.id}
                    className="border-white/5 hover:bg-white/5"
                  >
                    <TableCell className="font-medium text-[#dfe2eb]">
                      {role.name}
                      {isSystemRole(role.name) && (
                        <Badge
                          variant="secondary"
                          className="ml-2 bg-[#00f0ff]/10 text-[#00f0ff]"
                        >
                          System
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-[#00f0ff]/30 text-[#00f0ff]"
                      >
                        {role.rolePermissions?.length ?? 0} permission
                        {(role.rolePermissions?.length ?? 0) !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            isSystemRole(role.name) ||
                            deleteRoleMutation.isPending
                          }
                          onClick={() => handleEditRole(role)}
                          className="border-white/10 text-[#bacac5] hover:text-[#dfe2eb]"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRole(role)}
                          disabled={
                            isSystemRole(role.name) ||
                            deleteRoleMutation.isPending
                          }
                          className={`border-white/10 ${
                            isSystemRole(role.name)
                              ? 'cursor-not-allowed opacity-50'
                              : 'text-red-400 hover:text-red-300'
                          }`}
                        >
                          {deleteRoleMutation.isPending ? (
                            <>
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </>
                          )}
                        </Button>
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
