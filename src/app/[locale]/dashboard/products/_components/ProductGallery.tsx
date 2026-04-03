'use client';

import { useRef, useCallback } from 'react';
import { CloudUpload, Star, Trash2, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LocalMediaItem } from '../_schema';

interface ProductGalleryProps {
  items: LocalMediaItem[];
  onChange: (items: LocalMediaItem[]) => void;
}

export function ProductGallery({ items, onChange }: ProductGalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null);

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

  // ── Set cover ──────────────────────────────────────────────────────────
  const setPrimary = useCallback(
    (index: number) => {
      onChange(items.map((item, i) => ({ ...item, isPrimary: i === index })));
    },
    [items, onChange]
  );

  // ── Remove ─────────────────────────────────────────────────────────────
  const remove = useCallback(
    (index: number) => {
      URL.revokeObjectURL(items[index].previewUrl);
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
            {items.map((item, index) => (
              <motion.div
                key={item.previewUrl}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.18 }}
                className="group border-border bg-muted/20 relative aspect-square overflow-hidden rounded-2xl border"
              >
                {/* Preview image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="h-full w-full object-cover"
                />

                {/* Cover badge */}
                {item.isPrimary && (
                  <div className="bg-primary absolute top-2 left-2 flex items-center gap-1 rounded-full px-2 py-0.5">
                    <Star className="fill-primary-foreground text-primary-foreground h-2.5 w-2.5" />
                    <span className="text-primary-foreground text-[9px] font-bold tracking-wider uppercase">
                      Cover
                    </span>
                  </div>
                )}

                {/* Hover actions overlay */}
                <div className="absolute inset-0 flex items-end justify-between gap-1 bg-black/60 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  {!item.isPrimary && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPrimary(index);
                      }}
                      className="bg-primary/90 text-primary-foreground hover:bg-primary flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-bold tracking-wider uppercase transition-all"
                    >
                      <Star className="h-2.5 w-2.5" />
                      Set Cover
                    </button>
                  )}
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
            ))}

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
