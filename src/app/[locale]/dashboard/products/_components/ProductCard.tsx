'use client';
/* eslint-disable @next/next/no-img-element */

import { motion } from 'framer-motion';
import { ImageIcon } from 'lucide-react';

import { ProductActionsMenu } from './ProductActionsMenu';
import { ProductSpecs } from './ProductSpecs';
import { formatPrice, getTypeConfig, type Product } from './product-types';

export function ProductCard({
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-lg transition-all hover:border-white/20 hover:shadow-2xl"
    >
      <div className="absolute top-3 right-3 z-10 opacity-0 transition-opacity group-hover:opacity-100">
        <ProductActionsMenu product={product} />
      </div>

      <div className="relative h-48 w-full overflow-hidden rounded-t-xl bg-zinc-800">
        {primaryMedia ? (
          <img
            src={process.env.NEXT_PUBLIC_BACKEND_URL + primaryMedia.file_url}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-zinc-800 to-zinc-950">
            <ImageIcon className="h-8 w-8 text-zinc-700" />
          </div>
        )}

        <div
          className={`absolute top-3 left-3 flex items-center gap-1.5 rounded-md px-2.5 py-1 shadow-sm backdrop-blur-md ${typeConfig.badgeColor}`}
        >
          <TypeIcon className="h-3.5 w-3.5 text-white" />
          <span className="text-[10px] font-bold tracking-wider text-white uppercase">
            {typeConfig.label}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="truncate text-base leading-snug font-semibold text-zinc-100">
          {product.title}
        </h3>

        <ProductSpecs specs={product.specifications} />

        <div className="mt-auto flex items-end justify-between border-t border-white/5 pt-4">
          <div className="flex flex-col">
            <span className="mb-0.5 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
              Base Price
            </span>
            <span className="text-lg leading-none font-bold text-zinc-100">
              {formatPrice(product.base_price, product.currency)}
            </span>
          </div>

          <div className="flex gap-2">
            {product._count?.instances !== undefined &&
              product.type === 'SCHEDULED_EVENT' && (
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-bold tracking-wider text-zinc-500 uppercase">
                    Inst
                  </span>
                  <span className="text-xs font-semibold text-zinc-300">
                    {product._count.instances}
                  </span>
                </div>
              )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
