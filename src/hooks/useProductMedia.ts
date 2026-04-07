'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { setProductPrimaryMedia } from '@/lib/api/products';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/useAuthStore';

type SetPrimaryMediaVariables = {
  productId: string;
  mediaId: string;
};

export function useSetProductPrimaryMediaMutation() {
  const queryClient = useQueryClient();
  const organizationId = useAuthStore((state) => state.activeOrganizationId);

  return useMutation({
    mutationFn: async ({ productId, mediaId }: SetPrimaryMediaVariables) => {
      if (!organizationId) {
        throw new Error('No active organization selected.');
      }

      await setProductPrimaryMedia(organizationId, productId, mediaId);
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['product', variables.productId],
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.products.detail(
            organizationId,
            variables.productId
          ),
        }),
      ]);
    },
    onError: () => {
      toast.error('Failed to set primary image. Please try again.');
    },
  });
}
