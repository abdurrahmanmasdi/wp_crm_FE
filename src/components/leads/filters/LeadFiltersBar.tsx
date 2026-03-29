'use client';

import { useEffect, useMemo } from 'react';
import {
  Controller,
  type Path,
  useFieldArray,
  useForm,
  useWatch,
} from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  MultiSelectFilter,
  type MultiSelectFilterOption,
} from '@/components/ui/multi-select-filter';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  COMMON_ISO_COUNTRIES,
  MOCK_LEAD_SOURCES,
  MOCK_PIPELINE_STAGES,
} from '@/constants/regions';
import { useOrganizationMembersQuery } from '@/hooks/useLeads';
import { cn } from '@/lib/utils';
import type { LeadPriority, LeadStatus } from '@/types/leads';

export type LeadFilterField =
  | 'status'
  | 'priority'
  | 'country'
  | 'assigned_agent_id'
  | 'pipeline_stage_id'
  | 'source_id';

export type LeadFilterOperator = 'equals' | 'in';
export type LeadFilterValue = string | string[];

export type LeadFilterRule = {
  field: LeadFilterField;
  operator: LeadFilterOperator;
  value: LeadFilterValue;
};

type LeadFiltersFormValues = {
  rules: LeadFilterRule[];
};

type LeadFiltersBarProps = {
  initialRules: LeadFilterRule[];
  onRulesChange: (rules: LeadFilterRule[]) => void;
  className?: string;
};

const FILTER_FIELDS: LeadFilterField[] = [
  'status',
  'priority',
  'country',
  'assigned_agent_id',
  'pipeline_stage_id',
  'source_id',
];

const MULTI_SELECT_FIELDS: LeadFilterField[] = [
  'status',
  'priority',
  'assigned_agent_id',
  'source_id',
  'pipeline_stage_id',
];

const FILTER_OPERATORS: LeadFilterOperator[] = ['equals', 'in'];
const STATUS_OPTIONS: LeadStatus[] = ['OPEN', 'WON', 'LOST', 'UNQUALIFIED'];
const PRIORITY_OPTIONS: LeadPriority[] = ['HOT', 'WARM', 'COLD'];

function isFilterField(value: unknown): value is LeadFilterField {
  return (
    typeof value === 'string' &&
    FILTER_FIELDS.includes(value as LeadFilterField)
  );
}

function isFilterOperator(value: unknown): value is LeadFilterOperator {
  return (
    typeof value === 'string' &&
    FILTER_OPERATORS.includes(value as LeadFilterOperator)
  );
}

function isMultiSelectField(field: LeadFilterField): boolean {
  return MULTI_SELECT_FIELDS.includes(field);
}

function createRegionDisplayNames(locale: string): Intl.DisplayNames | null {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' });
  } catch {
    try {
      return new Intl.DisplayNames(['en'], { type: 'region' });
    } catch {
      return null;
    }
  }
}

function normalizeStringArray(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  if (typeof input === 'string') {
    const normalized = input.trim();
    return normalized.length > 0 ? [normalized] : [];
  }

  return [];
}

function normalizeStringValue(input: unknown): string {
  if (typeof input === 'string') {
    return input.trim();
  }

  if (Array.isArray(input)) {
    const firstString = input.find((entry) => typeof entry === 'string');
    return typeof firstString === 'string' ? firstString.trim() : '';
  }

  return '';
}

export function parseLeadFiltersParam(param: string | null): LeadFilterRule[] {
  if (!param) {
    return [];
  }

  const parsePayload = (payload: unknown): LeadFilterRule[] => {
    if (!Array.isArray(payload)) {
      return [];
    }

    const parsedRules: LeadFilterRule[] = [];

    for (const item of payload) {
      const record =
        item && typeof item === 'object'
          ? (item as Record<string, unknown>)
          : null;

      if (!record || !isFilterField(record.field)) {
        continue;
      }

      const operator = isFilterOperator(record.operator)
        ? record.operator
        : isMultiSelectField(record.field)
          ? 'in'
          : 'equals';

      if (isMultiSelectField(record.field)) {
        const rawValues = Array.isArray(record.value)
          ? normalizeStringArray(record.value)
          : operator === 'in' && typeof record.value === 'string'
            ? record.value
                .split(',')
                .map((entry) => entry.trim())
                .filter((entry) => entry.length > 0)
            : normalizeStringArray(record.value);

        parsedRules.push({
          field: record.field,
          operator,
          value: rawValues,
        });
        continue;
      }

      parsedRules.push({
        field: record.field,
        operator,
        value: normalizeStringValue(record.value),
      });
    }

    return parsedRules;
  };

  try {
    return parsePayload(JSON.parse(param));
  } catch {
    try {
      return parsePayload(JSON.parse(decodeURIComponent(param)));
    } catch {
      return [];
    }
  }
}

export function serializeLeadFiltersParam(
  rules: LeadFilterRule[]
): string | null {
  type SerializedRule = {
    field: LeadFilterField;
    operator: LeadFilterOperator;
    value: string | string[];
  };

  const payload: SerializedRule[] = [];

  for (const rule of rules) {
    if (isMultiSelectField(rule.field)) {
      const values = normalizeStringArray(rule.value);

      if (values.length === 0) {
        continue;
      }

      if (rule.operator === 'equals') {
        payload.push({
          field: rule.field,
          operator: rule.operator,
          value: values[0],
        });
        continue;
      }

      payload.push({
        field: rule.field,
        operator: 'in',
        value: values,
      });
      continue;
    }

    const value = normalizeStringValue(rule.value);

    if (value.length === 0) {
      continue;
    }

    if (rule.operator === 'in') {
      const values = value
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);

      if (values.length === 0) {
        continue;
      }

      payload.push({
        field: rule.field,
        operator: rule.operator,
        value: values,
      });
      continue;
    }

    payload.push({
      field: rule.field,
      operator: rule.operator,
      value,
    });
  }

  if (payload.length === 0) {
    return null;
  }

  return JSON.stringify(payload);
}

function getDefaultRule(field: LeadFilterField): LeadFilterRule {
  if (isMultiSelectField(field)) {
    return {
      field,
      operator: 'in',
      value: [],
    };
  }

  return {
    field,
    operator: 'equals',
    value: '',
  };
}

function getMultiSelectOptions(
  field: LeadFilterField,
  params: {
    statusOptions: MultiSelectFilterOption[];
    priorityOptions: MultiSelectFilterOption[];
    stageOptions: MultiSelectFilterOption[];
    sourceOptions: MultiSelectFilterOption[];
    agentOptions: MultiSelectFilterOption[];
  }
): MultiSelectFilterOption[] {
  switch (field) {
    case 'status':
      return params.statusOptions;
    case 'priority':
      return params.priorityOptions;
    case 'pipeline_stage_id':
      return params.stageOptions;
    case 'source_id':
      return params.sourceOptions;
    case 'assigned_agent_id':
      return params.agentOptions;
    default:
      return [];
  }
}

export function LeadFiltersBar({
  initialRules,
  onRulesChange,
  className,
}: LeadFiltersBarProps) {
  const t = useTranslations('Leads');
  const locale = useLocale();
  const membersQuery = useOrganizationMembersQuery();

  const form = useForm<LeadFiltersFormValues>({
    defaultValues: {
      rules: initialRules,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'rules',
  });

  const watchedRules = useWatch({
    control: form.control,
    name: 'rules',
  });

  useEffect(() => {
    form.reset({ rules: initialRules });
  }, [form, initialRules]);

  useEffect(() => {
    onRulesChange(watchedRules ?? []);
  }, [onRulesChange, watchedRules]);

  const regionDisplayNames = useMemo(
    () => createRegionDisplayNames(locale),
    [locale]
  );

  const countryOptions = useMemo(
    () =>
      COMMON_ISO_COUNTRIES.map((country) => ({
        value: country.value,
        label: regionDisplayNames?.of(country.value) ?? country.label,
      })),
    [regionDisplayNames]
  );

  const statusOptions = useMemo(
    () =>
      STATUS_OPTIONS.map((status) => ({
        value: status,
        label: t(`status.${status}` as never),
      })),
    [t]
  );

  const priorityOptions = useMemo(
    () =>
      PRIORITY_OPTIONS.map((priority) => ({
        value: priority,
        label: t(`priority.${priority}` as never),
      })),
    [t]
  );

  const stageOptions = useMemo(
    () =>
      MOCK_PIPELINE_STAGES.map((stage) => ({
        value: stage.id,
        label: stage.name,
      })),
    []
  );

  const sourceOptions = useMemo(
    () =>
      MOCK_LEAD_SOURCES.map((source) => ({
        value: source.id,
        label: source.name,
      })),
    []
  );

  const agentOptions = membersQuery.data ?? [];

  const renderValueInput = (
    index: number,
    field: LeadFilterField,
    operator: LeadFilterOperator
  ) => {
    const valuePath = `rules.${index}.value` as Path<LeadFiltersFormValues>;

    if (isMultiSelectField(field)) {
      const options = getMultiSelectOptions(field, {
        statusOptions,
        priorityOptions,
        stageOptions,
        sourceOptions,
        agentOptions,
      });

      return (
        <Controller
          control={form.control}
          name={valuePath}
          render={({ field: valueField }) => {
            const selectedValues = normalizeStringArray(valueField.value);

            return (
              <MultiSelectFilter
                options={options}
                value={selectedValues}
                onChange={valueField.onChange}
                placeholder={t('filters.multiSelectPlaceholder')}
                searchPlaceholder={t('form.searchPlaceholder')}
                emptyLabel={t('form.noResults')}
                selectedCountLabel={(count) =>
                  t('filters.selectedCount', { count })
                }
                disabled={
                  field === 'assigned_agent_id' && membersQuery.isLoading
                }
                className={field === 'assigned_agent_id' ? 'w-64' : 'w-56'}
              />
            );
          }}
        />
      );
    }

    switch (field) {
      case 'country':
        return (
          <div className="min-w-56">
            <SearchableSelect
              control={form.control}
              name={valuePath}
              label={t('filters.value')}
              hideLabel
              placeholder={t('filters.valuePlaceholder')}
              options={countryOptions}
              searchPlaceholder={t('form.searchPlaceholder')}
              emptyLabel={t('form.noResults')}
            />
          </div>
        );

      default:
        return (
          <Controller
            control={form.control}
            name={valuePath}
            render={({ field: valueField }) => (
              <Input
                value={normalizeStringValue(valueField.value)}
                onChange={valueField.onChange}
                placeholder={
                  operator === 'in'
                    ? `${t('filters.valuePlaceholder')} (${t('filters.in')})`
                    : t('filters.valuePlaceholder')
                }
                className="w-56"
              />
            )}
          />
        );
    }
  };

  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-wrap items-center gap-2',
        className
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="h-8">
            <Plus className="mr-2 h-4 w-4" />
            {t('filters.addFilter')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-56">
          {FILTER_FIELDS.map((field) => (
            <DropdownMenuItem
              key={field}
              onClick={() => append(getDefaultRule(field))}
            >
              {t(`form.fields.${field}.label` as never)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {fields.map((fieldEntry, index) => {
        const activeRule = watchedRules?.[index] ?? fieldEntry;
        const activeField = isFilterField(activeRule.field)
          ? activeRule.field
          : 'status';
        const activeOperator = isFilterOperator(activeRule.operator)
          ? activeRule.operator
          : isMultiSelectField(activeField)
            ? 'in'
            : 'equals';

        return (
          <div
            key={fieldEntry.id}
            className="bg-background flex flex-wrap items-start gap-2 rounded-lg border border-white/10 px-2 py-1"
          >
            <p className="text-foreground pt-2 text-sm font-medium">
              {t(`form.fields.${activeField}.label` as never)}
            </p>

            <Controller
              control={form.control}
              name={`rules.${index}.operator` as const}
              render={({ field }) => (
                <Select
                  value={
                    typeof field.value === 'string' ? field.value : 'equals'
                  }
                  onValueChange={(nextOperator) => {
                    field.onChange(nextOperator);

                    const currentValue = form.getValues(`rules.${index}.value`);
                    const isActiveMulti = isMultiSelectField(activeField);

                    if (isActiveMulti && nextOperator === 'in') {
                      form.setValue(
                        `rules.${index}.value`,
                        normalizeStringArray(currentValue),
                        { shouldDirty: true, shouldTouch: true }
                      );
                      return;
                    }

                    if (isActiveMulti && nextOperator === 'equals') {
                      const values = normalizeStringArray(currentValue);
                      form.setValue(
                        `rules.${index}.value`,
                        values.length > 0 ? [values[0]] : [],
                        { shouldDirty: true, shouldTouch: true }
                      );
                      return;
                    }

                    if (!isActiveMulti) {
                      form.setValue(
                        `rules.${index}.value`,
                        normalizeStringValue(currentValue),
                        { shouldDirty: true, shouldTouch: true }
                      );
                    }
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder={t('filters.operator')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">
                      {t('filters.equals')}
                    </SelectItem>
                    <SelectItem value="in">{t('filters.in')}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />

            {renderValueInput(index, activeField, activeOperator)}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-1 h-7 w-7"
              onClick={() => remove(index)}
              aria-label={t('filters.removeFilter')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
