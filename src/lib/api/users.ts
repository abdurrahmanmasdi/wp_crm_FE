import { api } from '@/lib/api';

/**
 * Response payload for the effective permission list endpoint.
 */
export type PermissionsResponse = {
  permissions: string[];
};

/**
 * Fetches the authenticated user's effective permissions in a specific organization context.
 *
 * Endpoint: `GET /users/me/permissions`
 *
 * @param organizationId Organization ID forwarded as `x-organization-id` header.
 * @returns A promise resolving to the effective permissions array for the provided organization.
 * @throws Error if the request fails, such as missing/invalid organization context.
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
