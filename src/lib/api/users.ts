import { api } from '@/lib/api';

export type PermissionsResponse = {
  permissions: string[];
};

/**
 * Fetch the current user's effective permissions for a specific organization
 * @param organizationId - The organization ID to fetch permissions for
 * @returns Promise containing the user's permissions array for that organization
 * @throws Error if the request fails (e.g., 400 if organization context is missing)
 */
export async function fetchMyPermissions(
  organizationId: string
): Promise<string[]> {
  const response = await api.get<PermissionsResponse>('/users/me/permissions', {
    headers: {
      'x-organization-id': organizationId,
    },
  });

  return response.data.permissions;
}
