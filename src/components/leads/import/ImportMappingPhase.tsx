'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useTranslations } from 'next-intl';

import type { LeadPriority, LeadStatus } from '@/types/leads-generated';
import type { BatchSettings, ImportMapping } from './import.types';
import { ImportBatchSettingsSection } from './ImportBatchSettingsSection';
import { ImportMappingSection } from './ImportMappingSection';

type Option = { label: string; value: string };

type ImportMappingPhaseProps = {
  fileName: string;
  rowsCount: number;
  mapping: ImportMapping;
  setMapping: Dispatch<SetStateAction<ImportMapping>>;
  headers: string[];
  batchSettings: BatchSettings;
  setBatchSettings: Dispatch<SetStateAction<BatchSettings>>;
  statusOptions: LeadStatus[];
  priorityOptions: LeadPriority[];
  leadSourcesData: { id: string; name: string }[];
  isLeadSourcesLoading: boolean;
  countryOptions: Option[];
  timezoneOptions: Option[];
  languageOptions: Option[];
};

export function ImportMappingPhase({
  fileName,
  rowsCount,
  mapping,
  setMapping,
  headers,
  batchSettings,
  setBatchSettings,
  statusOptions,
  priorityOptions,
  leadSourcesData,
  isLeadSourcesLoading,
  countryOptions,
  timezoneOptions,
  languageOptions,
}: ImportMappingPhaseProps) {
  const t = useTranslations('Leads');

  return (
    <div className="space-y-4">
      <div className="bg-muted/30 rounded-lg border p-3">
        <p className="text-sm font-medium">
          {t('import.mapping.fileName', { file: fileName })}
        </p>
        <p className="text-muted-foreground text-xs">
          {t('import.mapping.rowsCount', { count: rowsCount })}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ImportMappingSection
          mapping={mapping}
          setMapping={setMapping}
          headers={headers}
        />

        <ImportBatchSettingsSection
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
      </div>
    </div>
  );
}
