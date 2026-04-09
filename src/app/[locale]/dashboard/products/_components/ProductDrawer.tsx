'use client';
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarDays,
  Clock,
  ImageIcon,
  Package,
  Tag,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { Sheet, SheetClose, SheetContent } from '@/components/ui/sheet';
import { productService } from '@/lib/api/products';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/useAuthStore';
import {
  formatDate,
  formatPrice,
  getTypeConfig,
  type Product,
} from './product-types';

export function ProductDetailsDrawer({
  product,
  isOpen,
  onClose,
}: {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const activeOrganizationId = useAuthStore((s) => s.activeOrganizationId);
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: fullProduct, isLoading } = useQuery({
    queryKey: queryKeys.products.detail(
      activeOrganizationId,
      product?.id || ''
    ),
    queryFn: () => {
      if (!activeOrganizationId) {
        throw new Error('Active organization is required');
      }

      return productService.getById(activeOrganizationId, product!.id);
    },
    enabled: !!activeOrganizationId && !!product?.id && isOpen,
  });

  if (!product) {
    return null;
  }

  const displayProduct = (fullProduct as unknown as Product) || product;
  const typeConfig = getTypeConfig(displayProduct.type);
  const TypeIcon = typeConfig.icon;

  // Get all media or empty array
  const mediaItems = displayProduct.media || [];

  // Ensure current slide is within bounds
  const safeSlide = Math.min(currentSlide, Math.max(0, mediaItems.length - 1));

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto border-white/10 bg-zinc-950 p-0 text-white sm:max-w-xl">
        {/* Gallery Carousel Header */}
        <div className="relative h-64 w-full overflow-hidden border-b border-white/10 bg-zinc-900">
          {mediaItems.length > 0 ? (
            <>
              {/* Main Image with Slide Animation */}
              <AnimatePresence mode="wait">
                <motion.img
                  key={safeSlide}
                  src={
                    process.env.NEXT_PUBLIC_BACKEND_URL +
                    mediaItems[safeSlide].file_url
                  }
                  alt={displayProduct.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                />
              </AnimatePresence>

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-zinc-950 to-transparent" />

              {/* Previous button */}
              {mediaItems.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  className="absolute top-1/2 left-3 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur-md transition-all hover:border-white/60 hover:bg-black/60"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}

              {/* Next button */}
              {mediaItems.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute top-1/2 right-3 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur-md transition-all hover:border-white/60 hover:bg-black/60"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}

              {/* Pagination dots */}
              {mediaItems.length > 1 && (
                <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                  {mediaItems.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        goToSlide(idx);
                      }}
                      className={`h-2 rounded-full transition-all ${
                        idx === safeSlide
                          ? 'w-6 bg-white'
                          : 'w-2 bg-white/50 hover:bg-white/70'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Image counter */}
              {mediaItems.length > 1 && (
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                  {safeSlide + 1} / {mediaItems.length}
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-zinc-800 to-zinc-900">
              <ImageIcon className="h-12 w-12 text-zinc-700" />
            </div>
          )}

          <SheetClose className="absolute top-4 right-4 z-10 cursor-pointer rounded-full border border-white/10 bg-black/50 p-2 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-black/80">
            <X className="h-4 w-4" />
          </SheetClose>

          <div className="absolute right-6 bottom-6 left-6">
            <div
              className={`mb-3 inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 shadow-sm backdrop-blur-md ${typeConfig.badgeColor}`}
            >
              <TypeIcon className="h-4 w-4 text-white" />
              <span className="text-xs font-bold tracking-wider text-white uppercase">
                {typeConfig.label}
              </span>
            </div>
            <h2 className="mb-1 text-2xl leading-tight font-bold text-white">
              {displayProduct.title}
            </h2>
          </div>
        </div>

        <div className="relative space-y-8 p-6">
          {isLoading && (
            <div className="absolute top-0 left-0 h-1 w-full overflow-hidden bg-zinc-900">
              <div className="bg-primary/50 h-full w-1/3 animate-pulse rounded" />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/5 bg-zinc-900/50 p-4">
            <div className="min-w-30 flex-1 flex-col">
              <span className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                <Tag className="h-3.5 w-3.5" /> Base Price
              </span>
              <span className="text-2xl font-bold text-white">
                {formatPrice(
                  displayProduct.base_price,
                  displayProduct.currency
                )}
              </span>
            </div>
            {displayProduct.type === 'SCHEDULED_EVENT' && (
              <div className="min-w-30 flex-1 flex-col">
                <span className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                  <CalendarDays className="h-3.5 w-3.5" /> Scheduled Instances
                </span>
                <span className="text-xl font-bold text-zinc-200">
                  {displayProduct._count?.instances ||
                    displayProduct.instances?.length ||
                    0}
                </span>
              </div>
            )}
          </div>

          {displayProduct.description && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold tracking-widest text-zinc-300 uppercase">
                Description
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                {displayProduct.description}
              </p>
            </div>
          )}

          {displayProduct.instances && displayProduct.instances.length > 0 && (
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold tracking-widest text-zinc-300 uppercase">
                <Clock className="h-4 w-4" />
                Upcoming Instances
              </h3>
              <div className="space-y-2">
                {displayProduct.instances.map((inst, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between gap-3 rounded-lg border border-white/5 bg-zinc-900 p-3 sm:flex-row sm:items-center"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-200">
                        {formatDate(inst.start_date)}
                      </span>
                      <span className="text-xs text-zinc-500">
                        until {formatDate(inst.end_date)}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-4 border-l border-white/5 pl-4">
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                          Capacity
                        </span>
                        <span className="text-xs font-semibold text-zinc-300">
                          {inst.booked_quantity} / {inst.max_capacity}
                        </span>
                      </div>
                      <div
                        className={`h-2 w-2 rounded-full ${
                          inst.is_available ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                        title={inst.is_available ? 'Available' : 'Full'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {displayProduct.specifications &&
            Object.keys(displayProduct.specifications).length > 0 && (
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold tracking-widest text-zinc-300 uppercase">
                  <Package className="h-4 w-4" />
                  Specifications
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(displayProduct.specifications).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex flex-col rounded-lg border border-white/5 bg-zinc-900 p-3"
                      >
                        <span className="mb-1 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm font-medium text-zinc-200">
                          {typeof value === 'boolean'
                            ? value
                              ? 'Yes'
                              : 'No'
                            : String(value)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {displayProduct.available_addons &&
            displayProduct.available_addons.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold tracking-widest text-zinc-300 uppercase">
                  Available Add-ons
                </h3>
                <div className="space-y-2">
                  {displayProduct.available_addons.map((addon, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-zinc-900 p-3"
                    >
                      <span className="text-sm font-medium text-zinc-200">
                        {addon.name}
                      </span>
                      <span className="text-sm font-bold text-zinc-400">
                        +{formatPrice(addon.price, displayProduct.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
