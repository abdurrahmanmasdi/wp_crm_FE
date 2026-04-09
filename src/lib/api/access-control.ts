import {
  accessControlControllerAssignPermissionOverrideV1,
  accessControlControllerChangeMemberRoleV1,
  accessControlControllerCreateRoleV1,
  accessControlControllerDeleteRoleV1,
  accessControlControllerGetMemberPermissionBreakdownV1,
  accessControlControllerGetRolesV1,
  accessControlControllerUpdateRoleV1,
} from '@/api-generated/endpoints/roles';
import { permissionsControllerGetAllPermissionsV1 } from '@/api-generated/endpoints/permissions';
import { membershipAccessControlControllerAssignRoleV1 } from '@/api-generated/endpoints/membership-access-control';
import type {
  CreatePermissionOverrideDto,
  CreateRoleDto,
  UpdateMemberRoleDto,
  UpdateRoleDto,
} from '@/api-generated/model';
import type {
  AssignRolePayload,
  CreatePermissionOverridePayload,
  CreateRolePayload,
  DeleteRoleResponse,
  Permission,
  PermissionBreakdown,
  PermissionOverride,
  Role,
  UpdateRolePayload,
} from '@/types/access-control-generated';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return typeof value === 'string' ? value : null;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function parseTranslations(value: unknown): Record<string, string> | undefined {
  if (!value) {
    return undefined;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') {
        return Object.entries(parsed as Record<string, unknown>).reduce<
          Record<string, string>
        >((accumulator, [key, item]) => {
          if (typeof item === 'string') {
            accumulator[key] = item;
          }

          return accumulator;
        }, {});
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<
      Record<string, string>
    >((accumulator, [key, item]) => {
      if (typeof item === 'string') {
        accumulator[key] = item;
      }

      return accumulator;
    }, {});
  }

  return undefined;
}

function normalizePermission(raw: unknown): Permission | null {
  const record = asRecord(raw);
  const id = asString(record.id);
  const action = asString(record.action);

  if (!id || !action) {
    return null;
  }

  return {
    id,
    action,
    description: asNullableString(record.description),
  };
}

function normalizeRole(raw: unknown): Role | null {
  const record = asRecord(raw);
  const id = asString(record.id);
  const name = asString(record.name);

  if (!id || !name) {
    return null;
  }

  const rolePermissions = Array.isArray(record.rolePermissions)
    ? record.rolePermissions
        .map((item) => {
          const permission = normalizePermission(asRecord(item).permission);
          return permission ? { permission } : null;
        })
        .filter((item): item is { permission: Permission } => item !== null)
    : [];

  return {
    id,
    name,
    slug: asString(record.slug) || undefined,
    name_translations: parseTranslations(record.name_translations),
    organization_id: asString(record.organization_id),
    created_at: asString(record.created_at),
    rolePermissions,
  };
}

export async function getPermissions(): Promise<Permission[]> {
  const response = await permissionsControllerGetAllPermissionsV1();

  return response
    .map(normalizePermission)
    .filter((item): item is Permission => item !== null);
}

export async function getRoles(orgId: string): Promise<Role[]> {
  const response = await accessControlControllerGetRolesV1(orgId);

  return response
    .map(normalizeRole)
    .filter((item): item is Role => item !== null);
}

export async function createRole(
  orgId: string,
  payload: CreateRolePayload
): Promise<Role> {
  const response = (await accessControlControllerCreateRoleV1(orgId, {
    name: payload.name,
    name_translations: payload.name_translations ?? {},
    permissionIds: payload.permissionIds,
  } as CreateRoleDto)) as unknown;
  const normalized = normalizeRole(response);

  if (!normalized) {
    throw new Error('Unexpected role response');
  }

  return normalized;
}

export async function updateRole(
  orgId: string,
  roleId: string,
  payload: UpdateRolePayload
): Promise<Role> {
  const response = (await accessControlControllerUpdateRoleV1(orgId, roleId, {
    ...(payload.name !== undefined ? { name: payload.name } : {}),
    name_translations: payload.name_translations ?? {},
    ...(payload.permissionIds !== undefined
      ? { permissionIds: payload.permissionIds }
      : {}),
    ...(payload.permissionsToRemove !== undefined
      ? { permissionsToRemove: payload.permissionsToRemove }
      : {}),
    ...(payload.permissionsToAdd !== undefined
      ? { permissionsToAdd: payload.permissionsToAdd }
      : {}),
  } as UpdateRoleDto)) as unknown;
  const normalized = normalizeRole(response);

  if (!normalized) {
    throw new Error('Unexpected role response');
  }

  return normalized;
}

export async function deleteRole(
  orgId: string,
  roleId: string
): Promise<DeleteRoleResponse> {
  const response = await accessControlControllerDeleteRoleV1(orgId, roleId);

  return {
    message: asString(response?.message) || 'Role deleted',
  };
}

export async function assignRoleToMember(
  orgId: string,
  membershipId: string,
  payload: AssignRolePayload
): Promise<{ id: string; role_id: string; message: string }> {
  const response = await membershipAccessControlControllerAssignRoleV1(
    orgId,
    membershipId,
    payload as UpdateMemberRoleDto
  );

  return {
    id: asString(response.id),
    role_id: asString(response.role_id) || payload.role_id,
    message: asString(response.message),
  };
}

export async function createPermissionOverride(
  orgId: string,
  membershipId: string,
  payload: CreatePermissionOverridePayload
): Promise<PermissionOverride> {
  const response = await accessControlControllerAssignPermissionOverrideV1(
    orgId,
    membershipId,
    payload as CreatePermissionOverrideDto
  );

  return {
    id: asString(response.id),
    permission_id: asString(response.permission_id) || payload.permission_id,
    is_granted: asBoolean(response.is_granted, payload.is_granted),
    message: asString(response.message) || undefined,
  };
}

export async function changeMemberRole(
  orgId: string,
  membershipId: string,
  roleId: string
): Promise<{ id: string; role_id: string; message: string }> {
  const response = await accessControlControllerChangeMemberRoleV1(
    orgId,
    membershipId,
    {
      role_id: roleId,
    }
  );

  return {
    id: asString(response.id),
    role_id: asString(response.role_id) || roleId,
    message: asString(response.message),
  };
}

export async function getMemberPermissionBreakdown(
  orgId: string,
  membershipId: string
): Promise<PermissionBreakdown> {
  const response = await accessControlControllerGetMemberPermissionBreakdownV1(
    orgId,
    membershipId
  );

  return {
    rolePermissionIds: asStringArray(response?.rolePermissionIds),
    grantedOverrideIds: asStringArray(response?.grantedOverrideIds),
  };
}
