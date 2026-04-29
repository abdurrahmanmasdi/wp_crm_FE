'use client';

import { useTranslations } from 'next-intl';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NONE_VALUE, type BatchSettings } from './import.types';
import type { LeadPriority, LeadStatus } from '@/types/leads-generated';

type Option = { label: string; value: string };

type ImportBatchSettingsSectionProps = {
  batchSettings: BatchSettings;
  setBatchSettings: (val: React.SetStateAction<BatchSettings>) => void;
  statusOptions: LeadStatus[];
  priorityOptions: LeadPriority[];
  leadSourcesData: { id: string; name: string }[];
  isLeadSourcesLoading: boolean;
  countryOptions: Option[];
  timezoneOptions: Option[];
  languageOptions: Option[];
};

export function ImportBatchSettingsSection({
  batchSettings,
  setBatchSettings,
  statusOptions,
  priorityOptions,
  leadSourcesData,
  isLeadSourcesLoading,
  countryOptions,
  timezoneOptions,
  languageOptions,
}: ImportBatchSettingsSectionProps) {
  const t = useTranslations('Leads');

  return (
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
          <p className="text-sm font-medium">{t('import.settings.status')}</p>
          <Select
            value={batchSettings.status || NONE_VALUE}
            onValueChange={(value) =>
              setBatchSettings((prev) => ({
                ...prev,
                status: value === NONE_VALUE ? '' : (value as LeadStatus),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t('import.settings.select')} />
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
          <p className="text-sm font-medium">{t('import.settings.priority')}</p>
          <Select
            value={batchSettings.priority || NONE_VALUE}
            onValueChange={(value) =>
              setBatchSettings((prev) => ({
                ...prev,
                priority: value === NONE_VALUE ? '' : (value as LeadPriority),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t('import.settings.select')} />
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
          <p className="text-sm font-medium">{t('import.settings.source')}</p>
          <Select
            value={batchSettings.source_id || NONE_VALUE}
            onValueChange={(value) =>
              setBatchSettings((prev) => ({ ...prev, source_id: value }))
            }
            disabled={isLeadSourcesLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('import.settings.select')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>
                {t('import.settings.none')}
              </SelectItem>
              {leadSourcesData.map((source) => (
                <SelectItem key={source.id} value={source.id}>
                  {source.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1">
          <p className="text-sm font-medium">{t('import.settings.country')}</p>
          <Select
            value={batchSettings.country || NONE_VALUE}
            onValueChange={(value) =>
              setBatchSettings((prev) => ({
                ...prev,
                country: value === NONE_VALUE ? '' : value,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t('import.settings.select')} />
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
          <p className="text-sm font-medium">{t('import.settings.timezone')}</p>
          <Select
            value={batchSettings.timezone || NONE_VALUE}
            onValueChange={(value) =>
              setBatchSettings((prev) => ({
                ...prev,
                timezone: value === NONE_VALUE ? '' : value,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t('import.settings.select')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>
                {t('import.settings.none')}
              </SelectItem>
              {timezoneOptions.map((timezone) => (
                <SelectItem key={timezone.value} value={timezone.value}>
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
              setBatchSettings((prev) => ({
                ...prev,
                primary_language: value === NONE_VALUE ? '' : value,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t('import.settings.select')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>
                {t('import.settings.none')}
              </SelectItem>
              {languageOptions.map((language) => (
                <SelectItem key={language.value} value={language.value}>
                  {language.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
