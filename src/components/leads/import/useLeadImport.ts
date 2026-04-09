'use client';

import { useMemo, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import Papa from 'papaparse';
import { useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  COMMON_ISO_COUNTRIES,
  MAJOR_TIMEZONES,
  SUPPORTED_LANGUAGES,
} from '@/constants/regions';
import {
  useLeadSourcesQuery,
  usePipelineStagesQuery,
} from '@/hooks/useCrmSettings';
import { getErrorMessage } from '@/lib/error-utils';
import { queryKeys } from '@/lib/query-keys';
import { useLeadsControllerBulkCreateV1 } from '@/api-generated/endpoints/leads';
import type { CreateLeadDto } from '@/api-generated/model';
import type { LeadPriority, LeadStatus } from '@/types/leads-generated';

import type {
  BatchSettings,
  ImportMapping,
  ImportPhase,
  ParsedCsvRow,
} from './import.types';
import { NONE_VALUE } from './import.types';

type LeadImportProgress = {
  processed: number;
  total: number;
  success: number;
  failed: number;
};

type UseLeadImportParams = {
  organizationId: string | null;
};

const REQUIRED_MAPPING_FIELDS: Array<keyof ImportMapping> = [
  'first_name',
  'last_name',
  'phone_number',
];

const DEFAULT_MAPPING: ImportMapping = {
  first_name: '',
  last_name: '',
  phone_number: '',
  email: '',
};

const DEFAULT_BATCH_SETTINGS: BatchSettings = {
  status: '',
  priority: '',
  source_id: '',
  pipeline_stage_id: '',
  country: '',
  timezone: '',
  primary_language: '',
};

const DEFAULT_PROGRESS: LeadImportProgress = {
  processed: 0,
  total: 0,
  success: 0,
  failed: 0,
};

const statusOptions: LeadStatus[] = ['OPEN', 'WON', 'LOST', 'UNQUALIFIED'];
const priorityOptions: LeadPriority[] = ['HOT', 'WARM', 'COLD'];

const BATCH_SIZE = 500;

const DEFAULT_CREATE_LEAD_DTO = {
  gender: 'UNKNOWN' as const,
  currency: 'USD' as const,
};

function createDisplayNames(
  locale: string,
  type: 'region' | 'language'
): Intl.DisplayNames | null {
  try {
    return new Intl.DisplayNames([locale], { type });
  } catch {
    try {
      return new Intl.DisplayNames(['en'], { type });
    } catch {
      return null;
    }
  }
}

function normalizeHeader(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function guessMapping(headers: string[]): ImportMapping {
  const normalizedEntries = headers.map((header) => ({
    header,
    normalized: normalizeHeader(header),
  }));

  const findHeader = (aliases: string[]) => {
    const aliasSet = new Set(aliases.map((alias) => normalizeHeader(alias)));
    const exact = normalizedEntries.find((item) =>
      aliasSet.has(item.normalized)
    );
    if (exact) {
      return exact.header;
    }

    const partial = normalizedEntries.find((item) =>
      aliases.some((alias) => item.normalized.includes(normalizeHeader(alias)))
    );

    return partial?.header ?? '';
  };

  return {
    first_name: findHeader(['first_name', 'first name', 'firstname', 'name']),
    last_name: findHeader(['last_name', 'last name', 'lastname', 'surname']),
    phone_number: findHeader([
      'phone_number',
      'phone number',
      'phone',
      'mobile',
    ]),
    email: findHeader(['email', 'email_address', 'mail']),
  };
}

function toParsedRows(data: unknown[]): ParsedCsvRow[] {
  return data
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const source = item as Record<string, unknown>;
      const row: ParsedCsvRow = {};

      Object.entries(source).forEach(([key, value]) => {
        if (key.trim().length === 0) {
          return;
        }

        if (typeof value === 'string') {
          row[key] = value.trim();
          return;
        }

        if (value === null || value === undefined) {
          row[key] = '';
          return;
        }

        row[key] = String(value).trim();
      });

      const hasAnyValue = Object.values(row).some((value) => value.length > 0);
      return hasAnyValue ? row : null;
    })
    .filter((row): row is ParsedCsvRow => row !== null);
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export function useLeadImport({ organizationId }: UseLeadImportParams) {
  const locale = useLocale();
  const t = useTranslations('Leads');
  const tTimezones = useTranslations('Timezones');
  const queryClient = useQueryClient();
  const pipelineStagesQuery = usePipelineStagesQuery();
  const leadSourcesQuery = useLeadSourcesQuery({ activeOnly: true });
  const bulkCreateMutation = useLeadsControllerBulkCreateV1();

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<ImportPhase>('upload');
  const [isParsing, setIsParsing] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedCsvRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [mapping, setMapping] = useState<ImportMapping>(DEFAULT_MAPPING);
  const [batchSettings, setBatchSettings] = useState<BatchSettings>(
    DEFAULT_BATCH_SETTINGS
  );
  const [progress, setProgress] =
    useState<LeadImportProgress>(DEFAULT_PROGRESS);

  const countryDisplayNames = useMemo(
    () => createDisplayNames(locale, 'region'),
    [locale]
  );
  const languageDisplayNames = useMemo(
    () => createDisplayNames(locale, 'language'),
    [locale]
  );

  const countryOptions = useMemo(
    () =>
      COMMON_ISO_COUNTRIES.map((country) => ({
        value: country.value,
        label: countryDisplayNames?.of(country.value) ?? country.label,
      })),
    [countryDisplayNames]
  );

  const timezoneOptions = useMemo(
    () =>
      MAJOR_TIMEZONES.map((timezone) => {
        let label = timezone.label;
        try {
          label = tTimezones(timezone.value as never);
        } catch {
          label = timezone.label;
        }

        return {
          value: timezone.value,
          label,
        };
      }),
    [tTimezones]
  );

  const languageOptions = useMemo(
    () =>
      SUPPORTED_LANGUAGES.map((language) => ({
        value: language.value,
        label: languageDisplayNames?.of(language.value) ?? language.label,
      })),
    [languageDisplayNames]
  );

  const progressPercentage =
    progress.total > 0
      ? Math.min(100, Math.round((progress.processed / progress.total) * 100))
      : 0;

  const canStartImport = useMemo(() => {
    if (phase !== 'mapping' || rows.length === 0) {
      return false;
    }

    return REQUIRED_MAPPING_FIELDS.every((field) => mapping[field].length > 0);
  }, [mapping, phase, rows.length]);

  const resetState = () => {
    setPhase('upload');
    setIsParsing(false);
    setHeaders([]);
    setRows([]);
    setFileName('');
    setMapping(DEFAULT_MAPPING);
    setBatchSettings(DEFAULT_BATCH_SETTINGS);
    setProgress(DEFAULT_PROGRESS);
  };

  const closeAndReset = () => {
    setOpen(false);
    resetState();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    const isInProgress =
      phase === 'processing' && progress.processed < progress.total;

    if (!nextOpen && isInProgress) {
      return;
    }

    setOpen(nextOpen);
    if (!nextOpen) {
      resetState();
    }
  };

  const parseFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error(t('import.errors.fileType'));
      return;
    }

    setIsParsing(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsParsing(false);

        const parsedHeaders = (results.meta.fields ?? []).filter(
          (header) => header.trim().length > 0
        );
        const parsedRows = toParsedRows(results.data as unknown[]);

        if (parsedHeaders.length === 0) {
          toast.error(t('import.errors.noHeaders'));
          return;
        }

        if (parsedRows.length === 0) {
          toast.error(t('import.errors.noRows'));
          return;
        }

        setFileName(file.name);
        setHeaders(parsedHeaders);
        setRows(parsedRows);
        setMapping(guessMapping(parsedHeaders));
        setPhase('mapping');
      },
      error: (error) => {
        setIsParsing(false);
        toast.error(getErrorMessage(error) || t('import.errors.parse'));
      },
    });
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    parseFile(selectedFile);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (!droppedFile) {
      return;
    }

    parseFile(droppedFile);
  };

  const handleStartImport = async () => {
    if (!organizationId) {
      toast.error(t('missingOrganizationTitle'));
      return;
    }

    if (!canStartImport) {
      toast.error(t('import.errors.mappingRequired'));
      return;
    }

    setPhase('processing');
    setProgress({
      processed: 0,
      total: rows.length,
      success: 0,
      failed: 0,
    });

    let successCount = 0;
    let failedCount = 0;
    const validLeads: CreateLeadDto[] = [];

    // First pass: build all valid lead payloads
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const firstName = (row[mapping.first_name] ?? '').trim();
      const lastName = (row[mapping.last_name] ?? '').trim();
      const phoneNumber = (row[mapping.phone_number] ?? '').trim();
      const emailValue = mapping.email ? (row[mapping.email] ?? '').trim() : '';

      // Validate required fields
      if (!firstName || !lastName || !phoneNumber) {
        failedCount += 1;
        continue;
      }

      const payload: CreateLeadDto = {
        ...DEFAULT_CREATE_LEAD_DTO,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        country: batchSettings.country || 'US',
        timezone: batchSettings.timezone || 'UTC',
        primary_language: batchSettings.primary_language || 'en',
      };

      if (emailValue.length > 0) {
        payload.email = emailValue as any;
      }

      if (batchSettings.status) {
        payload.status = batchSettings.status as any;
      }

      if (batchSettings.priority) {
        payload.priority = batchSettings.priority as any;
      }

      if (batchSettings.source_id && batchSettings.source_id !== NONE_VALUE) {
        payload.source_id = batchSettings.source_id as any;
      }

      if (
        batchSettings.pipeline_stage_id &&
        batchSettings.pipeline_stage_id !== NONE_VALUE
      ) {
        payload.pipeline_stage_id = batchSettings.pipeline_stage_id as any;
      }

      validLeads.push(payload);
    }

    // Chunk the valid leads
    const chunks = chunkArray(validLeads, BATCH_SIZE);

    // Second pass: send chunks sequentially
    try {
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
        const chunk = chunks[chunkIndex];

        try {
          await bulkCreateMutation.mutateAsync({
            organizationId,
            data: { leads: chunk },
          });

          successCount += chunk.length;
          const processedTotal = failedCount + successCount;

          setProgress({
            processed: Math.min(processedTotal, rows.length),
            total: rows.length,
            success: successCount,
            failed: failedCount,
          });
        } catch (error) {
          const errorMsg =
            getErrorMessage(error) || t('import.errors.batchFailed');
          toast.error(`Failed to import batch ${chunkIndex + 1}. ${errorMsg}`);
          throw error;
        }
      }

      await queryClient.invalidateQueries({
        queryKey: queryKeys.leads.base(organizationId),
      });

      toast.success(
        t('import.finished', {
          success: successCount,
          failed: failedCount,
          total: rows.length,
        })
      );

      closeAndReset();
    } catch (error) {
      toast.error(t('import.errors.aborted'));
      // Reset to mapping phase to allow retry
      setPhase('mapping');
      setProgress({
        processed: 0,
        total: rows.length,
        success: 0,
        failed: 0,
      });
    }
  };

  return {
    open,
    phase,
    isParsing,
    fileName,
    headers,
    rows,
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
    leadSourcesData: leadSourcesQuery.data ?? [],
    isLeadSourcesLoading: leadSourcesQuery.isLoading,
    pipelineStagesData: pipelineStagesQuery.data ?? [],
    isPipelineStagesLoading: pipelineStagesQuery.isLoading,
    setMapping,
    setBatchSettings,
    handleOpenChange,
    handleFileInputChange,
    handleDrop,
    handleStartImport,
  };
}
