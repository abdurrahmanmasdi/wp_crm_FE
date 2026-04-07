import { api } from '@/lib/api';

/**
 * Sets a product media item as the primary cover image.
 *
 * Endpoint: `PATCH /organizations/:orgId/products/:productId/media/:mediaId/primary`
 */
export async function setProductPrimaryMedia(
  organizationId: string,
  productId: string,
  mediaId: string
): Promise<void> {
  await api.patch(
    `/organizations/${organizationId}/products/${productId}/media/${mediaId}/primary`
  );
}
