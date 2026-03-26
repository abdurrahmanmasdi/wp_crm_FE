/**
 * Access Control Service
 * Handles all API calls related to roles, permissions, and access control
 */

import { api } from '@/lib/api';
import {
  Permission,
  Role,
  CreateRolePayload,
  UpdateRolePayload,
  DeleteRoleResponse,
  AssignRolePayload,
  CreatePermissionOverridePayload,
  PermissionOverride,
} from '@/types/access-control';

export const accessControlService = {
  /**
   * Fetch all global system permissions
   * Available for authenticated users to view permission list
   */
  getPermissions(): Promise<{ data: Permission[] }> {
    return api.get<Permission[]>('/permissions');
  },

  /**
   * Get all roles for an organization
   * Includes permissions associated with each role
   */
  getRoles(orgId: string): Promise<{ data: Role[] }> {
    return api.get<Role[]>(`/organizations/${orgId}/roles`);
  },

  /**
   * Create a new role in the organization
   * Requires: name and array of permission IDs
   */
  createRole(
    orgId: string,
    payload: CreateRolePayload
  ): Promise<{ data: Role }> {
    return api.post<Role>(`/organizations/${orgId}/roles`, payload);
  },

  /**
   * Update an existing role's name and/or permissions
   * Both name and permissionIds are optional - only include fields to update
   */
  updateRole(
    orgId: string,
    roleId: string,
    payload: UpdateRolePayload
  ): Promise<{ data: Role }> {
    return api.patch<Role>(`/organizations/${orgId}/roles/${roleId}`, payload);
  },

  /**
   * Delete a role from the organization
   * Restrictions:
   * - Cannot delete 'Owner' or 'Admin' protected roles
   * - Cannot delete roles with active members
   */
  deleteRole(
    orgId: string,
    roleId: string
  ): Promise<{ data: DeleteRoleResponse }> {
    return api.delete<DeleteRoleResponse>(
      `/organizations/${orgId}/roles/${roleId}`
    );
  },

  /**
   * Assign a role to an organization member
   * Updates the membership to use the new role
   */
  assignRoleToMember(
    orgId: string,
    membershipId: string,
    payload: AssignRolePayload
  ): Promise<{ data: { id: string; role_id: string; message: string } }> {
    return api.patch(
      `/organizations/${orgId}/memberships/${membershipId}/role`,
      payload
    );
  },

  /**
   * Create or update a permission override for a member
   * Allows granting or revoking specific permissions regardless of role
   */
  createPermissionOverride(
    orgId: string,
    membershipId: string,
    payload: CreatePermissionOverridePayload
  ): Promise<{ data: PermissionOverride }> {
    return api.post(
      `/organizations/${orgId}/memberships/${membershipId}/overrides`,
      payload
    );
  },

  /**
   * Change a member's role within an organization
   * Updates the membership to assign a new role
   * Only Owner can perform this action
   */
  changeMemberRole(
    orgId: string,
    membershipId: string,
    roleId: string
  ): Promise<{ data: { id: string; role_id: string; message: string } }> {
    return api.patch(
      `/organizations/${orgId}/roles/memberships/${membershipId}/role`,
      { role_id: roleId }
    );
  },
};
