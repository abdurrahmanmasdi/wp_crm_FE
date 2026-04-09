'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Loader2, MoreVertical, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { usePermissions } from '@/hooks/usePermissions';
import { productService } from '@/lib/api/products';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/useAuthStore';
import type { Product } from './product-types';

export function ProductActionsMenu({ product }: { product: Product }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const activeOrganizationId = useAuthStore((s) => s.activeOrganizationId);

  const canUpdate =
    hasPermission('products', 'update') || hasPermission('product', 'edit');
  const canDelete =
    hasPermission('products', 'delete') || hasPermission('product', 'delete');

  const [isOpen, setIsOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!activeOrganizationId) {
        throw new Error('Active organization is required');
      }

      return productService.delete(activeOrganizationId, product.id);
    },
    onSuccess: () => {
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.all(activeOrganizationId),
      });
    },
    onError: (err: unknown) => {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;

      toast.error('Failed to delete product', {
        description: message || 'An unexpected error occurred.',
      });
    },
    onSettled: () => {
      setIsOpen(false);
    },
  });

  if (!canUpdate && !canDelete) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="rounded-md border border-white/10 bg-black/60 p-2 text-white shadow-sm backdrop-blur-md hover:bg-black/80"
      >
        {deleteMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MoreVertical className="h-4 w-4" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-10 right-0 z-20 w-36 overflow-hidden rounded-lg border border-white/10 bg-zinc-900 shadow-xl">
          {canUpdate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                router.push(`/dashboard/products/edit/${product.id}`);
              }}
              className="w-full px-4 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <span className="flex items-center gap-2">
                <Edit className="h-3.5 w-3.5" /> Edit
              </span>
            </button>
          )}

          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (
                  window.confirm(
                    `Are you sure you want to delete ${product.title}?`
                  )
                ) {
                  deleteMutation.mutate();
                } else {
                  setIsOpen(false);
                }
              }}
              disabled={deleteMutation.isPending}
              className="w-full border-t border-white/5 px-4 py-2 text-left text-sm text-red-500 opacity-100 transition-colors hover:bg-red-500/10 disabled:opacity-50"
            >
              <span className="flex items-center gap-2">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
