'use client';

import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import {
  SharedSearchableSelectField,
  type SharedSearchableSelectOption,
} from '@/components/ui/form-controls/SharedSearchableSelectField';
import { SharedSelect } from '@/components/ui/form-controls/SharedSelect';
import { SharedTextField } from '@/components/ui/form-controls/SharedTextField';
import {
  useLeadSourcesQuery,
  usePipelineStagesQuery,
} from '@/hooks/useCrmSettings';

import {
  type AddLeadFormValues,
  currencyOptions,
  priorityOptions,
  statusOptions,
} from './form.config';

type LeadSalesSectionProps = {
  assignedAgentOptions: Array<SharedSearchableSelectOption>;
  isAgentsLoading?: boolean;
  disabled?: boolean;
};

export function LeadSalesSection({
  assignedAgentOptions,
  isAgentsLoading = false,
  disabled = false,
}: LeadSalesSectionProps) {
  const t = useTranslations('Leads');
  const pipelineStagesQuery = usePipelineStagesQuery();
  const leadSourcesQuery = useLeadSourcesQuery({ activeOnly: true });
  const { control } = useFormContext<AddLeadFormValues>();

  const pipelineStageOptions = useMemo(
    () =>
      (pipelineStagesQuery.data ?? []).map((stage) => ({
        value: stage.id,
        label: stage.name,
      })),
    [pipelineStagesQuery.data]
  );

  const leadSourceOptions = useMemo(
    () =>
      (leadSourcesQuery.data ?? []).map((source) => ({
        value: source.id,
        label: source.name,
      })),
    [leadSourcesQuery.data]
  );

  const isPipelineStagesLoading = pipelineStagesQuery.isLoading;
  const isLeadSourcesLoading = leadSourcesQuery.isLoading;

  const statusSelectOptions = useMemo(
    () =>
      statusOptions.map((status) => ({
        value: status,
        label: t(`status.${status}` as never),
      })),
    [t]
  );

  const prioritySelectOptions = useMemo(
    () =>
      priorityOptions.map((priority) => ({
        value: priority,
        label: t(`priority.${priority}` as never),
      })),
    [t]
  );

  const currencySelectOptions = useMemo(
    () =>
      currencyOptions.map((currency) => ({
        value: currency,
        label: t(`currency.${currency}` as never),
      })),
    [t]
  );

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <SharedSelect
          control={control}
          name="status"
          label={t('form.fields.status.label')}
          options={statusSelectOptions}
          disabled={disabled}
        />

        <SharedSelect
          control={control}
          name="priority"
          label={t('form.fields.priority.label')}
          options={prioritySelectOptions}
          disabled={disabled}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SharedSelect
          control={control}
          name="currency"
          label={t('form.fields.currency.label')}
          options={currencySelectOptions}
          disabled={disabled}
        />

        <SharedTextField
          control={control}
          name="estimated_value"
          label={t('form.fields.estimated_value.label')}
          placeholder={t('form.fields.estimated_value.placeholder')}
          type="number"
          step="0.01"
          parseAsNumber
          disabled={disabled}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SharedSearchableSelectField
          control={control}
          name="pipeline_stage_id"
          label={t('form.fields.pipeline_stage_id.label')}
          placeholder={t('form.fields.pipeline_stage_id.placeholder')}
          options={pipelineStageOptions}
          searchPlaceholder={t('form.searchPlaceholder')}
          emptyLabel={t('form.noResults')}
          allowNone
          noneLabel={t('form.noneOption')}
          disabled={disabled || isPipelineStagesLoading}
        />

        <SharedSearchableSelectField
          control={control}
          name="assigned_agent_id"
          label={t('form.fields.assigned_agent_id.label')}
          placeholder={t('form.fields.assigned_agent_id.placeholder')}
          options={assignedAgentOptions}
          searchPlaceholder={t('form.searchPlaceholder')}
          emptyLabel={t('form.noResults')}
          allowNone
          noneLabel={t('form.noneOption')}
          disabled={disabled || isAgentsLoading}
        />
      </div>

      <SharedSearchableSelectField
        control={control}
        name="source_id"
        label={t('form.fields.source_id.label')}
        placeholder={t('form.fields.source_id.placeholder')}
        options={leadSourceOptions}
        searchPlaceholder={t('form.searchPlaceholder')}
        emptyLabel={t('form.noResults')}
        allowNone
        noneLabel={t('form.noneOption')}
        disabled={disabled || isLeadSourcesLoading}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <SharedTextField
          control={control}
          name="expected_service_date"
          label={t('form.fields.expected_service_date.label')}
          placeholder={t('form.fields.expected_service_date.placeholder')}
          type="date"
          disabled={disabled}
        />

        <SharedTextField
          control={control}
          name="next_follow_up_at"
          label={t('form.fields.next_follow_up_at.label')}
          placeholder={t('form.fields.next_follow_up_at.placeholder')}
          type="date"
          disabled={disabled}
        />
      </div>
    </>
  );
}
