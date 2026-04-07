'use client';

import { useRef, useCallback } from 'react';
import { CloudUpload, Star, Trash2, ImageIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useSetProductPrimaryMediaMutation } from '@/hooks/useProductMedia';
import type { LocalMediaItem } from '../_schema';

interface ProductGalleryProps {
  items: LocalMediaItem[];
  onChange: (items: LocalMediaItem[]) => void;
  productId?: string;
}

export function ProductGallery({
  items,
  onChange,
  productId,
}: ProductGalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const setPrimaryMutation = useSetProductPrimaryMediaMutation();

  // ── File input handler ──────────────────────────────────────────────────
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const newItems: LocalMediaItem[] = Array.from(files).map((file, i) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        // First upload gets cover if there are no existing items
        isPrimary: items.length === 0 && i === 0,
      }));

      onChange([...items, ...newItems]);
    },
    [items, onChange]
  );

  // ── Drag & drop ────────────────────────────────────────────────────────
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  // ── Set cover locally ──────────────────────────────────────────────────
  const setPrimary = useCallback(
    (index: number) => {
      onChange(items.map((item, i) => ({ ...item, isPrimary: i === index })));
    },
    [items, onChange]
  );

  // ── Set cover (persisted media uses API, local items fallback to local state) ──
  const handleSetPrimary = useCallback(
    (index: number) => {
      const selectedItem = items[index];
      if (!selectedItem) return;

      if (productId && selectedItem.mediaId) {
        setPrimaryMutation.mutate(
          {
            productId,
            mediaId: selectedItem.mediaId,
          },
          {
            onSuccess: () => {
              setPrimary(index);
            },
          }
        );
        return;
      }

      setPrimary(index);
    },
    [items, productId, setPrimaryMutation, setPrimary]
  );

  // ── Remove ─────────────────────────────────────────────────────────────
  const remove = useCallback(
    (index: number) => {
      if (items[index].previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(items[index].previewUrl);
      }

      const next = items.filter((_, i) => i !== index);
      // If we removed the cover, promote the first remaining item
      if (next.length > 0 && !next.some((it) => it.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }

      onChange(next);
    },
    [items, onChange]
  );

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="group border-border bg-muted/20 hover:bg-muted/30 flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed transition-all"
      >
        <div className="bg-primary/10 mb-4 flex h-14 w-14 items-center justify-center rounded-full transition-transform group-hover:scale-110">
          <CloudUpload className="text-primary h-6 w-6" />
        </div>
        <p className="text-xs font-medium">
          Drag &amp; drop or{' '}
          <span className="text-primary underline underline-offset-2">
            browse
          </span>
        </p>
        <p className="text-muted-foreground mt-1.5 text-[10px]">
          Supports multiple files · JPG, PNG, WebP
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Thumbnails grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          <AnimatePresence initial={false}>
            {items.map((item, index) => {
              const isPendingCurrent =
                setPrimaryMutation.isPending &&
                setPrimaryMutation.variables?.mediaId === item.mediaId;

              return (
                <motion.div
                  key={item.mediaId || item.previewUrl}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.18 }}
                  className={`group bg-muted/20 relative aspect-square overflow-hidden rounded-2xl border ${
                    item.isPrimary
                      ? 'border-amber-300/70 ring-1 ring-amber-300/50'
                      : 'border-border'
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetPrimary(index);
                    }}
                    disabled={setPrimaryMutation.isPending}
                    className={`absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border transition-all ${
                      item.isPrimary
                        ? 'border-amber-300/80 bg-amber-400 text-zinc-950 shadow-sm'
                        : 'border-white/20 bg-black/55 text-white/80 opacity-20 group-hover:opacity-100 hover:bg-black/75'
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                    aria-label={
                      item.isPrimary
                        ? 'Primary cover image'
                        : 'Set as primary cover image'
                    }
                    title={
                      item.isPrimary
                        ? 'Primary cover image'
                        : 'Set as primary cover image'
                    }
                  >
                    {isPendingCurrent ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Star
                        className={`h-3.5 w-3.5 ${
                          item.isPrimary ? 'fill-current' : ''
                        }`}
                      />
                    )}
                  </button>

                  {/* Preview image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      (item.previewUrl.includes('/products/')
                        ? process.env.NEXT_PUBLIC_BACKEND_URL
                        : '') + item.previewUrl
                    }
                    alt={item.file?.name || 'Product media'}
                    className="h-full w-full object-cover"
                  />

                  {/* Hover actions overlay */}
                  <div className="absolute inset-0 flex items-end justify-between gap-1 bg-black/60 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(index);
                      }}
                      className="ml-auto rounded-lg bg-red-500/90 p-1 text-white transition-all hover:bg-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {/* Add more slot */}
            <motion.div
              key="add-more"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border-border bg-muted/10 text-muted-foreground/50 hover:bg-muted/20 hover:text-muted-foreground flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed transition-all"
              onClick={() => inputRef.current?.click()}
            >
              <ImageIcon className="h-5 w-5" />
              <span className="mt-1.5 text-[9px] font-bold tracking-wider uppercase">
                Add more
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {items.length > 0 && (
        <p className="text-muted-foreground/60 text-[10px]">
          {items.length} photo{items.length !== 1 ? 's' : ''} · hover a
          thumbnail to set cover or remove
        </p>
      )}
    </div>
  );
}
