'use client';

import { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import {
  SearchableSelect,
  type SearchableSelectOption,
} from '@/components/ui/searchable-select';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useLeadSourcesQuery,
  usePipelineStagesQuery,
} from '@/hooks/useCrmSettings';
import type { LeadCurrency, LeadPriority, LeadStatus } from '@/types/leads';

import {
  type AddLeadFormValues,
  currencyOptions,
  priorityOptions,
  statusOptions,
} from './form.config';

type LeadSalesSectionProps = {
  assignedAgentOptions: Array<SearchableSelectOption>;
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
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<AddLeadFormValues>();

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

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t('form.fields.status.label')}
          </label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => field.onChange(value as LeadStatus)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`status.${status}` as never)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t('form.fields.priority.label')}
          </label>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => field.onChange(value as LeadPriority)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {t(`priority.${priority}` as never)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t('form.fields.currency.label')}
          </label>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => field.onChange(value as LeadCurrency)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {t(`currency.${currency}` as never)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="estimated_value">
            {t('form.fields.estimated_value.label')}
          </label>
          <Input
            id="estimated_value"
            type="number"
            step="0.01"
            placeholder={t('form.fields.estimated_value.placeholder')}
            disabled={disabled}
            {...register('estimated_value', { valueAsNumber: true })}
          />
          {errors.estimated_value?.message ? (
            <p className="text-destructive text-xs">
              {errors.estimated_value.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SearchableSelect
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

        <SearchableSelect
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

      <SearchableSelect
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
        <div className="space-y-2">
          <label
            className="text-sm font-medium"
            htmlFor="expected_service_date"
          >
            {t('form.fields.expected_service_date.label')}
          </label>
          <Input
            id="expected_service_date"
            type="date"
            placeholder={t('form.fields.expected_service_date.placeholder')}
            disabled={disabled}
            {...register('expected_service_date')}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="next_follow_up_at">
            {t('form.fields.next_follow_up_at.label')}
          </label>
          <Input
            id="next_follow_up_at"
            type="date"
            placeholder={t('form.fields.next_follow_up_at.placeholder')}
            disabled={disabled}
            {...register('next_follow_up_at')}
          />
        </div>
      </div>
    </>
  );
}
