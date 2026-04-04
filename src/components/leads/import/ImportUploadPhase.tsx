'use client';

import type { ChangeEvent, DragEvent } from 'react';
import { useTranslations } from 'next-intl';

type ImportUploadPhaseProps = {
  isParsing: boolean;
  onFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
};

export function ImportUploadPhase({
  isParsing,
  onFileInputChange,
  onDrop,
}: ImportUploadPhaseProps) {
  const t = useTranslations('Leads');

  return (
    <div className="space-y-4">
      <div
        className="border-border bg-muted/30 rounded-xl border border-dashed p-6 text-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
      >
        <p className="text-sm font-medium">{t('import.uploadTitle')}</p>
        <p className="text-muted-foreground mt-1 text-xs">
          {t('import.uploadDescription')}
        </p>

        <div className="mt-4">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={onFileInputChange}
            disabled={isParsing}
          />
        </div>
      </div>
    </div>
  );
}
