'use client';

import { useMemo, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import Papa from 'papaparse';
import { FileDown } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  COMMON_ISO_COUNTRIES,
  MAJOR_TIMEZONES,
  SUPPORTED_LANGUAGES,
} from '@/constants/regions';
import {
  useLeadSourcesQuery,
  usePipelineStagesQuery,
} from '@/hooks/useCrmSettings';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-utils';
import type {
  CreateLeadPayload,
  LeadPriority,
  LeadStatus,
} from '@/types/leads';

type ImportPhase = 'upload' | 'mapping' | 'processing';

type ParsedCsvRow = Record<string, string>;

type ImportMapping = {
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
};

type BatchSettings = {
  status: LeadStatus | '';
  priority: LeadPriority | '';
  source_id: string;
  pipeline_stage_id: string;
  country: string;
  timezone: string;
  primary_language: string;
};

type ImportLeadsModalProps = {
  organizationId: string | null;
  disabled?: boolean;
};

const REQUIRED_MAPPING_FIELDS: Array<keyof ImportMapping> = [
  'first_name',
  'last_name',
  'phone_number',
];

const MAPPING_FIELD_LABEL_KEYS: Record<keyof ImportMapping, string> = {
  first_name: 'import.mapping.firstName',
  last_name: 'import.mapping.lastName',
  phone_number: 'import.mapping.phone',
  email: 'import.mapping.email',
};

const statusOptions: LeadStatus[] = ['OPEN', 'WON', 'LOST', 'UNQUALIFIED'];
const priorityOptions: LeadPriority[] = ['HOT', 'WARM', 'COLD'];
const NONE_VALUE = '__none__';

const STATIC_CREATE_PAYLOAD_DEFAULTS: Omit<
  CreateLeadPayload,
  | 'first_name'
  | 'last_name'
  | 'phone_number'
  | 'email'
  | 'status'
  | 'priority'
  | 'source_id'
  | 'pipeline_stage_id'
  | 'country'
  | 'timezone'
  | 'primary_language'
> = {
  gender: 'UNKNOWN',
  estimated_value: '0',
  currency: 'USD',
  native_name: null,
  preferred_language: null,
  assigned_agent_id: null,
  expected_service_date: null,
  next_follow_up_at: null,
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

export function ImportLeadsModal({
  organizationId,
  disabled = false,
}: ImportLeadsModalProps) {
  const locale = useLocale();
  const t = useTranslations('Leads');
  const tTimezones = useTranslations('Timezones');
  const queryClient = useQueryClient();
  const pipelineStagesQuery = usePipelineStagesQuery();
  const leadSourcesQuery = useLeadSourcesQuery({ activeOnly: true });

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<ImportPhase>('upload');
  const [isParsing, setIsParsing] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedCsvRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [mapping, setMapping] = useState<ImportMapping>({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
  });
  const [batchSettings, setBatchSettings] = useState<BatchSettings>({
    status: '',
    priority: '',
    source_id: '',
    pipeline_stage_id: '',
    country: '',
    timezone: '',
    primary_language: '',
  });
  const [progress, setProgress] = useState({
    processed: 0,
    total: 0,
    success: 0,
    failed: 0,
  });

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
    setMapping({
      first_name: '',
      last_name: '',
      phone_number: '',
      email: '',
    });
    setBatchSettings({
      status: '',
      priority: '',
      source_id: '',
      pipeline_stage_id: '',
      country: '',
      timezone: '',
      primary_language: '',
    });
    setProgress({
      processed: 0,
      total: 0,
      success: 0,
      failed: 0,
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && phase === 'processing') {
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

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const firstName = (row[mapping.first_name] ?? '').trim();
      const lastName = (row[mapping.last_name] ?? '').trim();
      const phoneNumber = (row[mapping.phone_number] ?? '').trim();
      const emailValue = mapping.email ? (row[mapping.email] ?? '').trim() : '';

      if (!firstName || !lastName || !phoneNumber) {
        failedCount += 1;
        setProgress({
          processed: index + 1,
          total: rows.length,
          success: successCount,
          failed: failedCount,
        });
        continue;
      }

      const payload: Record<string, unknown> = {
        ...STATIC_CREATE_PAYLOAD_DEFAULTS,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
      };

      if (emailValue.length > 0) {
        payload.email = emailValue;
      }

      if (batchSettings.status) {
        payload.status = batchSettings.status;
      }

      if (batchSettings.priority) {
        payload.priority = batchSettings.priority;
      }

      if (batchSettings.country) {
        payload.country = batchSettings.country;
      }

      if (batchSettings.timezone) {
        payload.timezone = batchSettings.timezone;
      }

      if (batchSettings.primary_language) {
        payload.primary_language = batchSettings.primary_language;
      }

      if (batchSettings.source_id && batchSettings.source_id !== NONE_VALUE) {
        payload.source_id = batchSettings.source_id;
      }

      if (
        batchSettings.pipeline_stage_id &&
        batchSettings.pipeline_stage_id !== NONE_VALUE
      ) {
        payload.pipeline_stage_id = batchSettings.pipeline_stage_id;
      }

      try {
        await api.post(`/organizations/${organizationId}/leads`, payload);
        successCount += 1;
      } catch {
        failedCount += 1;
      }

      setProgress({
        processed: index + 1,
        total: rows.length,
        success: successCount,
        failed: failedCount,
      });
    }

    await queryClient.invalidateQueries({
      queryKey: ['leads', organizationId],
    });

    toast.success(
      t('import.finished', {
        success: successCount,
        failed: failedCount,
        total: rows.length,
      })
    );

    handleOpenChange(false);
  };

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
          <div className="space-y-4">
            <div
              className="border-border bg-muted/30 rounded-xl border border-dashed p-6 text-center"
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              <p className="text-sm font-medium">{t('import.uploadTitle')}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {t('import.uploadDescription')}
              </p>

              <div className="mt-4">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileInputChange}
                  disabled={isParsing}
                />
              </div>
            </div>
          </div>
        ) : null}

        {phase === 'mapping' ? (
          <div className="space-y-4">
            <div className="bg-muted/30 rounded-lg border p-3">
              <p className="text-sm font-medium">
                {t('import.mapping.fileName', { file: fileName })}
              </p>
              <p className="text-muted-foreground text-xs">
                {t('import.mapping.rowsCount', { count: rows.length })}
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <section className="space-y-3 rounded-lg border p-3">
                <div>
                  <h3 className="text-sm font-semibold">
                    {t('import.mapping.sectionTitle')}
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {t('import.mapping.sectionDescription')}
                  </p>
                </div>

                {(
                  Object.keys(MAPPING_FIELD_LABEL_KEYS) as Array<
                    keyof ImportMapping
                  >
                ).map((fieldKey) => (
                  <div key={fieldKey} className="grid gap-1">
                    <p className="text-sm font-medium">
                      {t(MAPPING_FIELD_LABEL_KEYS[fieldKey] as never)}
                    </p>
                    <Select
                      value={mapping[fieldKey] || NONE_VALUE}
                      onValueChange={(value) =>
                        setMapping((previousMapping) => ({
                          ...previousMapping,
                          [fieldKey]: value === NONE_VALUE ? '' : value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t('import.mapping.selectColumn')}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>
                          {t('import.mapping.none')}
                        </SelectItem>
                        {headers.map((header) => (
                          <SelectItem
                            key={`${fieldKey}-${header}`}
                            value={header}
                          >
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </section>

              <section className="space-y-3 rounded-lg border p-3">
                <div>
                  <h3 className="text-sm font-semibold">
                    {t('import.settings.sectionTitle')}
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {t('import.settings.sectionDescription')}
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="grid gap-1">
                    <p className="text-sm font-medium">
                      {t('import.settings.status')}
                    </p>
                    <Select
                      value={batchSettings.status || NONE_VALUE}
                      onValueChange={(value) =>
                        setBatchSettings((previousSettings) => ({
                          ...previousSettings,
                          status:
                            value === NONE_VALUE ? '' : (value as LeadStatus),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t('import.settings.select')}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>
                          {t('import.settings.none')}
                        </SelectItem>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {t(`status.${status}` as never)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-1">
                    <p className="text-sm font-medium">
                      {t('import.settings.priority')}
                    </p>
                    <Select
                      value={batchSettings.priority || NONE_VALUE}
                      onValueChange={(value) =>
                        setBatchSettings((previousSettings) => ({
                          ...previousSettings,
                          priority:
                            value === NONE_VALUE ? '' : (value as LeadPriority),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t('import.settings.select')}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>
                          {t('import.settings.none')}
                        </SelectItem>
                        {priorityOptions.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {t(`priority.${priority}` as never)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-1">
                    <p className="text-sm font-medium">
                      {t('import.settings.source')}
                    </p>
                    <Select
                      value={batchSettings.source_id || NONE_VALUE}
                      onValueChange={(value) =>
                        setBatchSettings((previousSettings) => ({
                          ...previousSettings,
                          source_id: value,
                        }))
                      }
                      disabled={leadSourcesQuery.isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t('import.settings.select')}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>
                          {t('import.settings.none')}
                        </SelectItem>
                        {(leadSourcesQuery.data ?? []).map((source) => (
                          <SelectItem key={source.id} value={source.id}>
                            {source.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-1">
                    <p className="text-sm font-medium">
                      {t('import.settings.pipelineStage')}
                    </p>
                    <Select
                      value={batchSettings.pipeline_stage_id || NONE_VALUE}
                      onValueChange={(value) =>
                        setBatchSettings((previousSettings) => ({
                          ...previousSettings,
                          pipeline_stage_id: value,
                        }))
                      }
                      disabled={pipelineStagesQuery.isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t('import.settings.select')}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>
                          {t('import.settings.none')}
                        </SelectItem>
                        {(pipelineStagesQuery.data ?? []).map((stage) => (
                          <SelectItem key={stage.id} value={stage.id}>
                            {stage.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-1">
                    <p className="text-sm font-medium">
                      {t('import.settings.country')}
                    </p>
                    <Select
                      value={batchSettings.country || NONE_VALUE}
                      onValueChange={(value) =>
                        setBatchSettings((previousSettings) => ({
                          ...previousSettings,
                          country: value === NONE_VALUE ? '' : value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t('import.settings.select')}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>
                          {t('import.settings.none')}
                        </SelectItem>
                        {countryOptions.map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-1">
                    <p className="text-sm font-medium">
                      {t('import.settings.timezone')}
                    </p>
                    <Select
                      value={batchSettings.timezone || NONE_VALUE}
                      onValueChange={(value) =>
                        setBatchSettings((previousSettings) => ({
                          ...previousSettings,
                          timezone: value === NONE_VALUE ? '' : value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t('import.settings.select')}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>
                          {t('import.settings.none')}
                        </SelectItem>
                        {timezoneOptions.map((timezone) => (
                          <SelectItem
                            key={timezone.value}
                            value={timezone.value}
                          >
                            {timezone.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-1">
                    <p className="text-sm font-medium">
                      {t('import.settings.primaryLanguage')}
                    </p>
                    <Select
                      value={batchSettings.primary_language || NONE_VALUE}
                      onValueChange={(value) =>
                        setBatchSettings((previousSettings) => ({
                          ...previousSettings,
                          primary_language: value === NONE_VALUE ? '' : value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t('import.settings.select')}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>
                          {t('import.settings.none')}
                        </SelectItem>
                        {languageOptions.map((language) => (
                          <SelectItem
                            key={language.value}
                            value={language.value}
                          >
                            {language.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>
            </div>
          </div>
        ) : null}

        {phase === 'processing' ? (
          <div className="space-y-4">
            <p className="text-sm font-medium">
              {t('import.processing', {
                current: progress.processed,
                total: progress.total,
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
                success: progress.success,
                failed: progress.failed,
              })}
            </p>
          </div>
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
