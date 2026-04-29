'use client';

import { FileDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ImportMappingPhase } from './import/ImportMappingPhase';
import { ImportProcessingPhase } from './import/ImportProcessingPhase';
import { ImportUploadPhase } from './import/ImportUploadPhase';
import { useLeadImport } from './import/useLeadImport';

type ImportLeadsModalProps = {
  organizationId: string | null;
  disabled?: boolean;
};

export function ImportLeadsModal({
  organizationId,
  disabled = false,
}: ImportLeadsModalProps) {
  const t = useTranslations('Leads');
  const {
    open,
    phase,
    isParsing,
    fileName,
    rows,
    headers,
    mapping,
    batchSettings,
    progress,
    progressPercentage,
    canStartImport,
    statusOptions,
    priorityOptions,
    countryOptions,
    timezoneOptions,
    languageOptions,
    leadSourcesData,
    isLeadSourcesLoading,
    setMapping,
    setBatchSettings,
    handleOpenChange,
    handleFileInputChange,
    handleDrop,
    handleStartImport,
  } = useLeadImport({ organizationId });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" disabled={disabled}>
          <FileDown className="h-4 w-4" />
          {t('import.button')}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('import.title')}</DialogTitle>
          <DialogDescription>{t('import.description')}</DialogDescription>
        </DialogHeader>

        {phase === 'upload' ? (
          <ImportUploadPhase
            isParsing={isParsing}
            onFileInputChange={handleFileInputChange}
            onDrop={handleDrop}
          />
        ) : null}

        {phase === 'mapping' ? (
          <ImportMappingPhase
            fileName={fileName}
            rowsCount={rows.length}
            mapping={mapping}
            setMapping={setMapping}
            headers={headers}
            batchSettings={batchSettings}
            setBatchSettings={setBatchSettings}
            statusOptions={statusOptions}
            priorityOptions={priorityOptions}
            leadSourcesData={leadSourcesData}
            isLeadSourcesLoading={isLeadSourcesLoading}
            countryOptions={countryOptions}
            timezoneOptions={timezoneOptions}
            languageOptions={languageOptions}
          />
        ) : null}

        {phase === 'processing' ? (
          <ImportProcessingPhase
            processed={progress.processed}
            total={progress.total}
            success={progress.success}
            failed={progress.failed}
            progressPercentage={progressPercentage}
          />
        ) : null}

        <DialogFooter>
          {phase !== 'processing' ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {t('import.cancel')}
            </Button>
          ) : null}

          {phase === 'mapping' ? (
            <Button
              type="button"
              onClick={() => void handleStartImport()}
              disabled={!canStartImport}
            >
              {t('import.start')}
            </Button>
          ) : null}

          {phase === 'upload' ? (
            <Button type="button" disabled>
              {isParsing ? t('import.parsing') : t('import.start')}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
