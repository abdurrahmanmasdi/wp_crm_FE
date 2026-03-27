/**
 * Access Control Module - Types & Interfaces
 * Defines data structures for roles, permissions, and related payloads
 */

export type Permission = {
  id: string;
  action: string;
  description: string | null;
};

export type RolePermission = {
  permission: Permission;
};

export type Role = {
  id: string;
  name: string;
  name_translations?: Record<string, string>;
  organization_id: string;
  created_at: string;
  rolePermissions: RolePermission[];
};

export type CreateRolePayload = {
  name: string;
  name_translations?: Record<string, string>;
  permissionIds: string[];
};

export type UpdateRolePayload = {
  name?: string;
  name_translations?: Record<string, string>;
  permissionIds?: string[];
};

export type DeleteRoleResponse = {
  message: string;
};

export type AssignRolePayload = {
  role_id: string;
};

export type CreatePermissionOverridePayload = {
  permission_id: string;
  is_granted: boolean;
};

export type PermissionOverride = {
  id: string;
  permission_id: string;
  is_granted: boolean;
  message?: string;
};

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
};

export type RoleInfo = {
  id: string;
  name: string;
};

export type OrganizationMember = {
  membershipId: string;
  status: string;
  user: User;
  role: RoleInfo;
};
