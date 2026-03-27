import { useAuthStore } from '@/store/useAuthStore';

/**
 * Custom hook for frontend permission checks
 *
 * Implements permission checking logic that reads from the user's permissions array
 * synced from the backend's effective permissions calculation
 *
 * @example
 * // Check if user can manage leads resource
 * const { hasPermission } = usePermissions();
 * if (hasPermission('leads')) { ... }
 *
 * // Check specific action
 * if (hasPermission('leads', 'create')) { ... }
 *
 * // Check if user has manage permission (god mode)
 * if (hasPermission('leads', 'manage')) { ... }
 */
export function usePermissions() {
  const userPermissions = useAuthStore((state) => state.permissions);

  /**
   * Check if the current user has permission for a resource/action combination
   *
   * Permission Logic:
   * 1. If user has ${resource}:manage, always return true (god mode for that resource)
   * 2. If action is provided, check if user's permissions array includes ${resource}:${action}
   * 3. If no action is provided, check if any permission starts with ${resource}:
   *
   * @param resource - The resource to check (e.g., 'leads', 'contacts')
   * @param action - Optional action to check (e.g., 'read', 'create'). If omitted, checks for any permission on the resource
   * @returns true if user has the permission, false otherwise
   */
  const hasPermission = (resource: string, action?: string): boolean => {
    // Ensure user exists
    if (!userPermissions || typeof userPermissions !== 'object') {
      return false;
    }

    // Extract permissions array from user with safe default
    const permissions = userPermissions || [];

    // Validate permissions is an array (defensive guard)
    if (!Array.isArray(permissions)) {
      return false;
    }

    // Check for manage permission (god mode for the resource)
    const managePermission = `${resource}:manage`;
    if (permissions.includes(managePermission)) {
      return true;
    }

    // If an action is provided, check for exact permission match
    if (action) {
      const requiredPermission = `${resource}:${action}`;
      return permissions.includes(requiredPermission);
    }

    // If no action specified, check if any permission starts with the resource
    const resourcePrefix = `${resource}:`;
    return permissions.some((permission) =>
      permission.startsWith(resourcePrefix)
    );
  };

  return { hasPermission };
}
