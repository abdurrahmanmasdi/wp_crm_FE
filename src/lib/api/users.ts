import { usersControllerGetPermissionsV1 } from '@/api-generated/endpoints/users';

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
  const response = await usersControllerGetPermissionsV1({
    headers: {
      'x-organization-id': organizationId,
    },
  });

  return response.permissions ?? [];
}
