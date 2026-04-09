import type {
  CreatePermissionOverrideDto,
  CreateRoleDto,
  UpdateMemberRoleDto,
  UpdateRoleDto,
} from '@/api-generated/model';

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
  slug?: string;
  name_translations?: Record<string, string>;
  organization_id: string;
  created_at: string;
  rolePermissions: RolePermission[];
};

export type CreateRolePayload = Omit<CreateRoleDto, 'name_translations'> & {
  name_translations?: Record<string, string>;
};

export type UpdateRolePayload = Omit<UpdateRoleDto, 'name_translations'> & {
  name_translations?: Record<string, string>;
};

export type DeleteRoleResponse = {
  message: string;
};

export type AssignRolePayload = UpdateMemberRoleDto;

export type CreatePermissionOverridePayload = CreatePermissionOverrideDto;

export type PermissionOverride = {
  id: string;
  permission_id: string;
  is_granted: boolean;
  message?: string;
};

export type PermissionBreakdown = {
  rolePermissionIds: string[];
  grantedOverrideIds: string[];
};
