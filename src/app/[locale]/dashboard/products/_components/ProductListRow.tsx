'use client';
/* eslint-disable @next/next/no-img-element */

import { motion } from 'framer-motion';
import { ImageIcon } from 'lucide-react';

import { ProductActionsMenu } from './ProductActionsMenu';
import { ProductSpecs } from './ProductSpecs';
import { formatPrice, getTypeConfig, type Product } from './product-types';

export function ProductListRow({
  product,
  onClick,
}: {
  product: Product;
  onClick: () => void;
}) {
  const primaryMedia =
    product.media?.find((m) => m.is_primary) || product.media?.[0];
  const typeConfig = getTypeConfig(product.type);
  const TypeIcon = typeConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      onClick={onClick}
      className="group relative flex cursor-pointer items-center gap-5 rounded-xl border border-white/10 bg-zinc-900 p-3 pr-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-white/20 hover:shadow-md"
    >
      <div className="absolute top-1/2 right-3 z-10 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
        <ProductActionsMenu product={product} />
      </div>

      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/5 bg-zinc-800 sm:h-20 sm:w-20">
        {primaryMedia ? (
          <img
            src={process.env.NEXT_PUBLIC_BACKEND_URL + primaryMedia.file_url}
            alt={product.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-zinc-800 to-zinc-950">
            <ImageIcon className="h-5 w-5 text-zinc-700" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 pr-12">
        <div className="mb-1 flex items-center gap-2">
          <div
            className={`flex h-5 w-5 items-center justify-center rounded ${typeConfig.bg}`}
          >
            <TypeIcon className={`h-3 w-3 ${typeConfig.textColor}`} />
          </div>
          <h3 className="truncate text-sm font-semibold text-zinc-100 sm:text-base">
            {product.title}
          </h3>
        </div>
        <ProductSpecs specs={product.specifications} />
      </div>

      <div className="hidden items-center gap-6 pr-12 text-sm md:flex">
        {product.type === 'SCHEDULED_EVENT' && (
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-bold text-zinc-500 uppercase">
              Instances
            </span>
            <span className="font-medium text-zinc-300">
              {product._count?.instances || 0}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6 pr-8">
        <div className="flex min-w-22.5 flex-col text-right">
          <span className="mb-0.5 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
            Price
          </span>
          <span className="font-bold text-zinc-100">
            {formatPrice(product.base_price, product.currency)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
