'use client';

import { BookOpen } from 'lucide-react';
import { PdfUploader } from '@/components/knowledge/PdfUploader';

export default function KnowledgeBasePage() {
  return (
    <div className="space-y-8">
      {/* ── Section header ─────────────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
          <BookOpen className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-foreground text-xl font-semibold">
            Knowledge Base
          </h2>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-6">
            Feed your AI assistant clinic-specific information. Every PDF you
            upload is chunked, embedded into the vector database, and becomes
            instantly available to the AI when it responds to leads.
          </p>
        </div>
      </div>

      {/* ── PDF uploader ───────────────────────────────────────────────────── */}
      <PdfUploader />
    </div>
  );
}
