'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { FileText, Loader2, Upload, X, BookOpen, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { uploadKnowledgePdf } from '@/lib/api/knowledge';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ── Component ────────────────────────────────────────────────────────────────

export function PdfUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [lastUploadedName, setLastUploadedName] = useState<string | null>(null);

  // ── File selection ─────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (!selected) return;

    if (selected.type !== 'application/pdf') {
      toast.error('Only PDF files are accepted.');
      return;
    }

    // 20 MB guard — large PDFs can overwhelm chunking pipelines
    if (selected.size > 20 * 1024 * 1024) {
      toast.error('File is too large. Please upload a PDF under 20 MB.');
      return;
    }

    setFile(selected);
    setLastUploadedName(null); // clear the previous success state
  };

  const handleClearFile = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  // ── Upload ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || isUploading) return;

    setIsUploading(true);

    try {
      const result = await uploadKnowledgePdf(file);

      const successMsg =
        result.message ||
        (result.chunks
          ? `"${file.name}" indexed — ${result.chunks} chunks added to the AI's memory.`
          : `"${file.name}" uploaded successfully.`);

      toast.success(successMsg);
      setLastUploadedName(file.name);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Upload failed. Please try again.';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  // ── Drag-and-drop support ──────────────────────────────────────────────────
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (!dropped) return;
    if (dropped.type !== 'application/pdf') {
      toast.error('Only PDF files are accepted.');
      return;
    }
    setFile(dropped);
    setLastUploadedName(null);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Card className="border-primary/20 bg-primary/5 overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-2xl shadow-[0_0_24px_var(--glow-primary-md)]">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl">Upload Clinic Knowledge Base</CardTitle>
            <CardDescription className="mt-1 max-w-xl">
              Upload pricing lists, procedure details, or clinic policies as a PDF.
              The AI will learn this information instantly and use it when
              responding to leads.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drop zone */}
          <div
            role="button"
            tabIndex={0}
            aria-label="PDF drop zone — click or drag a file here"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => !isUploading && inputRef.current?.click()}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !isUploading) {
                inputRef.current?.click();
              }
            }}
            className={[
              'border-border bg-background/50 relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors',
              isUploading
                ? 'cursor-not-allowed opacity-60'
                : 'hover:border-primary/50 hover:bg-primary/5',
              file ? 'border-primary/40' : '',
            ].join(' ')}
          >
            {/* Hidden native input */}
            <input
              id="pdf-upload-input"
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={handleFileChange}
              disabled={isUploading}
            />

            {file ? (
              /* Selected file preview */
              <div className="flex w-full max-w-sm items-center gap-3 text-left">
                <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                  <FileText className="text-primary h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-medium">
                    {file.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatBytes(file.size)} · PDF
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Remove selected file"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearFile();
                  }}
                  className="text-muted-foreground hover:text-foreground shrink-0 rounded p-1 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : lastUploadedName ? (
              /* Success confirmation */
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                <p className="text-sm font-medium text-emerald-400">
                  &ldquo;{lastUploadedName}&rdquo; indexed successfully
                </p>
                <p className="text-muted-foreground text-xs">
                  Click or drag to upload another document
                </p>
              </div>
            ) : (
              /* Empty state */
              <>
                <Upload className="text-muted-foreground h-8 w-8" />
                <div>
                  <p className="text-foreground text-sm font-medium">
                    Click to browse or drag a PDF here
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    PDF only · max 20 MB
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Submit button */}
          <Button
            id="pdf-upload-submit"
            type="submit"
            disabled={!file || isUploading}
            className="w-full sm:w-auto"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload to Knowledge Base
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
