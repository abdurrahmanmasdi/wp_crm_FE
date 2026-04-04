'use client';

import { useTranslations } from 'next-intl';

type ImportProcessingPhaseProps = {
  processed: number;
  total: number;
  success: number;
  failed: number;
  progressPercentage: number;
};

export function ImportProcessingPhase({
  processed,
  total,
  success,
  failed,
  progressPercentage,
}: ImportProcessingPhaseProps) {
  const t = useTranslations('Leads');

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">
        {t('import.processing', {
          current: processed,
          total,
        })}
      </p>
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div
          className="bg-primary h-full transition-all"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <p className="text-muted-foreground text-xs">
        {t('import.processingStats', {
          success,
          failed,
        })}
      </p>
    </div>
  );
}
