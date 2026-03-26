/**
 * Permission Registry
 *
 * FRONTEND PARITY WITH BACKEND
 * Single source of truth for all RBAC/PBAC permissions in the system.
 * Uses TypeScript's `as const` to create a strict registry that prevents typos
 * and ensures type safety throughout the frontend codebase.
 *
 * This mirrors the backend registry exactly to maintain absolute parity
 * in permission definitions across the full stack.
 *
 * All permission strings are automatically inferred from Resources + Actions,
 * eliminating magic strings and typos.
 *
 * Usage:
 * 1. In permission checks: `permission.startsWith(AppResource.LEADS)`
 * 2. In UI logic: Use AppPermission constants for comparisons
 * 3. Helper: `getResourcePrefix(permission)` returns the resource part
 */

/**
 * Resource definitions - all resources in the system
 */
export const AppResource = {
  TEAM_MEMBERS: 'team_members',
  ROLES: 'roles',
  ORGANIZATION: 'organization',
  LEADS: 'leads',
  CONTACTS: 'contacts',
  DEALS: 'deals',
  TASKS: 'tasks',
  BILLING: 'billing',
  REPORTS: 'reports',
} as const;

/**
 * Action definitions - all possible actions on resources
 */
export const AppAction = {
  MANAGE: 'manage', // God mode for the resource (deprecated but kept for compatibility)
  READ: 'read', // Read assigned/own items
  READ_ALL: 'read_all', // Read all items in organization
  CREATE: 'create',
  EDIT: 'edit', // Edit assigned/own items
  EDIT_ALL: 'edit_all', // Edit all items in organization
  DELETE: 'delete', // Delete assigned/own items
  DELETE_ALL: 'delete_all', // Delete all items in organization
  RESTORE: 'restore',
} as const;

/**
 * Type-safe permission string builder
 * Ensures only valid combinations of Resource:Action are created
 */
export type PermissionString =
  `${(typeof AppResource)[keyof typeof AppResource]}:${(typeof AppAction)[keyof typeof AppAction]}`;

/**
 * Pre-built permission constants for convenience
 * These are the primary permissions used throughout the frontend
 */
export const AppPermission = {
  // Team Members & Access Control
  TEAM_MEMBERS_MANAGE:
    `${AppResource.TEAM_MEMBERS}:${AppAction.MANAGE}` as const,
  TEAM_MEMBERS_READ: `${AppResource.TEAM_MEMBERS}:${AppAction.READ}` as const,
  TEAM_MEMBERS_CREATE:
    `${AppResource.TEAM_MEMBERS}:${AppAction.CREATE}` as const,
  TEAM_MEMBERS_EDIT: `${AppResource.TEAM_MEMBERS}:${AppAction.EDIT}` as const,
  TEAM_MEMBERS_DELETE:
    `${AppResource.TEAM_MEMBERS}:${AppAction.DELETE}` as const,

  // Roles
  ROLES_READ: `${AppResource.ROLES}:${AppAction.READ}` as const,
  ROLES_CREATE: `${AppResource.ROLES}:${AppAction.CREATE}` as const,
  ROLES_EDIT: `${AppResource.ROLES}:${AppAction.EDIT}` as const,
  ROLES_DELETE: `${AppResource.ROLES}:${AppAction.DELETE}` as const,
  ROLES_MANAGE: `${AppResource.ROLES}:${AppAction.MANAGE}` as const,

  // Organization
  ORGANIZATION_READ: `${AppResource.ORGANIZATION}:${AppAction.READ}` as const,
  ORGANIZATION_EDIT: `${AppResource.ORGANIZATION}:${AppAction.EDIT}` as const,
  ORGANIZATION_MANAGE:
    `${AppResource.ORGANIZATION}:${AppAction.MANAGE}` as const,

  // Leads
  LEADS_READ: `${AppResource.LEADS}:${AppAction.READ}` as const,
  LEADS_READ_ALL: `${AppResource.LEADS}:${AppAction.READ_ALL}` as const,
  LEADS_CREATE: `${AppResource.LEADS}:${AppAction.CREATE}` as const,
  LEADS_EDIT: `${AppResource.LEADS}:${AppAction.EDIT}` as const,
  LEADS_EDIT_ALL: `${AppResource.LEADS}:${AppAction.EDIT_ALL}` as const,
  LEADS_DELETE: `${AppResource.LEADS}:${AppAction.DELETE}` as const,
  LEADS_DELETE_ALL: `${AppResource.LEADS}:${AppAction.DELETE_ALL}` as const,
  LEADS_RESTORE: `${AppResource.LEADS}:${AppAction.RESTORE}` as const,

  // Contacts
  CONTACTS_READ: `${AppResource.CONTACTS}:${AppAction.READ}` as const,
  CONTACTS_READ_ALL: `${AppResource.CONTACTS}:${AppAction.READ_ALL}` as const,
  CONTACTS_CREATE: `${AppResource.CONTACTS}:${AppAction.CREATE}` as const,
  CONTACTS_EDIT: `${AppResource.CONTACTS}:${AppAction.EDIT}` as const,
  CONTACTS_EDIT_ALL: `${AppResource.CONTACTS}:${AppAction.EDIT_ALL}` as const,
  CONTACTS_DELETE: `${AppResource.CONTACTS}:${AppAction.DELETE}` as const,
  CONTACTS_DELETE_ALL:
    `${AppResource.CONTACTS}:${AppAction.DELETE_ALL}` as const,
  CONTACTS_RESTORE: `${AppResource.CONTACTS}:${AppAction.RESTORE}` as const,

  // Deals
  DEALS_READ: `${AppResource.DEALS}:${AppAction.READ}` as const,
  DEALS_READ_ALL: `${AppResource.DEALS}:${AppAction.READ_ALL}` as const,
  DEALS_CREATE: `${AppResource.DEALS}:${AppAction.CREATE}` as const,
  DEALS_EDIT: `${AppResource.DEALS}:${AppAction.EDIT}` as const,
  DEALS_EDIT_ALL: `${AppResource.DEALS}:${AppAction.EDIT_ALL}` as const,
  DEALS_DELETE: `${AppResource.DEALS}:${AppAction.DELETE}` as const,
  DEALS_DELETE_ALL: `${AppResource.DEALS}:${AppAction.DELETE_ALL}` as const,
  DEALS_RESTORE: `${AppResource.DEALS}:${AppAction.RESTORE}` as const,

  // Tasks
  TASKS_READ: `${AppResource.TASKS}:${AppAction.READ}` as const,
  TASKS_READ_ALL: `${AppResource.TASKS}:${AppAction.READ_ALL}` as const,
  TASKS_CREATE: `${AppResource.TASKS}:${AppAction.CREATE}` as const,
  TASKS_EDIT: `${AppResource.TASKS}:${AppAction.EDIT}` as const,
  TASKS_EDIT_ALL: `${AppResource.TASKS}:${AppAction.EDIT_ALL}` as const,
  TASKS_DELETE: `${AppResource.TASKS}:${AppAction.DELETE}` as const,
  TASKS_DELETE_ALL: `${AppResource.TASKS}:${AppAction.DELETE_ALL}` as const,
  TASKS_RESTORE: `${AppResource.TASKS}:${AppAction.RESTORE}` as const,

  // Billing
  BILLING_READ: `${AppResource.BILLING}:${AppAction.READ}` as const,
  BILLING_MANAGE: `${AppResource.BILLING}:${AppAction.MANAGE}` as const,

  // Reports
  REPORTS_READ: `${AppResource.REPORTS}:${AppAction.READ}` as const,
  REPORTS_CREATE: `${AppResource.REPORTS}:${AppAction.CREATE}` as const,
  REPORTS_EDIT: `${AppResource.REPORTS}:${AppAction.EDIT}` as const,
  REPORTS_DELETE: `${AppResource.REPORTS}:${AppAction.DELETE}` as const,
} as const;

/**
 * Helper to extract resource prefix from permission action
 * @example getResourcePrefix('leads:read') -> 'leads'
 */
export function getResourcePrefix(
  permissionAction: string
): (typeof AppResource)[keyof typeof AppResource] {
  return permissionAction.split(
    ':'
  )[0] as (typeof AppResource)[keyof typeof AppResource];
}

/**
 * Helper to format resource name for display
 * @example formatResourceName('leads') -> 'Leads'
 */
export function formatResourceName(resource: string): string {
  return resource
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Helper to check if permission belongs to a resource
 * @example hasPermissionForResource('leads:read', 'leads') -> true
 */
export function hasPermissionForResource(
  permission: string,
  resource: (typeof AppResource)[keyof typeof AppResource]
): boolean {
  return getResourcePrefix(permission) === resource;
}
