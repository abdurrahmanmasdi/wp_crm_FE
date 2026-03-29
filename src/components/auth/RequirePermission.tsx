'use client';

import React, { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';

interface RequirePermissionProps {
  /**
   * The resource to check permission for (e.g., 'leads', 'contacts')
   */
  resource: string;

  /**
   * Optional action to check (e.g., 'create', 'edit')
   * If omitted, checks if user has any permission for the resource
   */
  action?: string;

  /**
   * Fallback behavior when user doesn't have permission
   * - 'hide': Return null (removes component from DOM)
   * - 'disable': Visually disable the component with opacity and cursor styles
   * @default 'hide'
   */
  fallback?: 'hide' | 'disable';

  /**
   * Child element(s) to render if permission is granted
   */
  children: ReactNode;
}

/**
 * RequirePermission Component
 *
 * Declarative wrapper for permission-based UI control.
 * Cleanly hides or disables child elements based on user permissions.
 *
 * @example
 * // Hide a button if user doesn't have permission
 * <RequirePermission resource={AppResource.LEADS} action={AppAction.CREATE}>
 *   <button>Create Lead</button>
 * </RequirePermission>
 *
 * // Disable a feature if user lacks permission
 * <RequirePermission
 *   resource={AppResource.LEADS}
 *   action={AppAction.DELETE}
 *   fallback="disable"
 * >
 *   <Button>Delete</Button>
 * </RequirePermission>
 *
 * // Check resource-level access
 * <RequirePermission resource={AppResource.REPORTS}>
 *   <ReportsPanel />
 * </RequirePermission>
 */
export function RequirePermission({
  resource,
  action,
  fallback = 'hide',
  children,
}: RequirePermissionProps) {
  const { hasPermission } = usePermissions();

  // Check if user has the required permission
  const isAllowed = hasPermission(resource, action);

  // If allowed, render children as-is
  if (isAllowed) {
    return <>{children}</>;
  }
  // Handle fallback behavior
  if (fallback === 'hide') {
    // Hide: return null (remove from DOM)
    return null;
  }

  if (fallback === 'disable') {
    // Disable: clone the child element with disabled prop and styling
    return React.Children.map(children, (child) => {
      // Only process valid React elements
      if (!React.isValidElement(child)) {
        return child;
      }

      // Clone the element with disabled prop and additional CSS classes
      const childProps = child.props as Record<string, unknown>;
      return React.cloneElement(child, {
        disabled: true,
        className: cn(
          childProps.className as string,
          'opacity-50 cursor-not-allowed pointer-events-none'
        ),
      } as React.Attributes);
    });
  }

  // Fallback (shouldn't reach here with proper typing)
  return null;
}
