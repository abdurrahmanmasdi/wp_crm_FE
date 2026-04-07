'use client';

import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { UniversalFilterBuilder } from '@/components/ui/universal-filter/UniversalFilterBuilder';
import type {
  FilterAstNode,
  FilterConfig,
  FilterOperator,
  FilterRule,
} from '@/components/ui/universal-filter/filter.types';
import type { LeadPriority, LeadStatus } from '@/types/leads';

type LeadFiltersBarProps = {
  initialRules: LeadFilterRule[];
  onRulesChange: (rules: LeadFilterRule[]) => void;
  className?: string;
};

export type LeadFilterRule = FilterRule;

const STATUS_OPTIONS: LeadStatus[] = ['OPEN', 'WON', 'LOST', 'UNQUALIFIED'];
const PRIORITY_OPTIONS: LeadPriority[] = ['HOT', 'WARM', 'COLD'];

function isFilterOperator(value: unknown): value is FilterOperator {
  return (
    value === 'equals' ||
    value === 'not_equals' ||
    value === 'contains' ||
    value === 'greater_than' ||
    value === 'less_than'
  );
}

function normalizeRuleValue(value: unknown): string | number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    const firstValue = value.find(
      (entry) => typeof entry === 'string' || typeof entry === 'number'
    );

    if (typeof firstValue === 'number') {
      return Number.isFinite(firstValue) ? firstValue : '';
    }

    if (typeof firstValue === 'string') {
      return firstValue;
    }
  }

  return '';
}

function parseRulesPayload(payload: unknown): LeadFilterRule[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.flatMap((item, index) => {
    const record =
      item && typeof item === 'object'
        ? (item as Record<string, unknown>)
        : null;

    if (!record || typeof record.field !== 'string' || !record.field.trim()) {
      return [];
    }

    const id =
      typeof record.id === 'string' && record.id.trim()
        ? record.id
        : `rule-${index}-${record.field}`;

    return [
      {
        id,
        field: record.field,
        operator: isFilterOperator(record.operator)
          ? record.operator
          : 'equals',
        value: normalizeRuleValue(record.value),
      },
    ];
  });
}

export function parseLeadFiltersParam(param: string | null): LeadFilterRule[] {
  if (!param) {
    return [];
  }

  try {
    return parseRulesPayload(JSON.parse(param));
  } catch {
    try {
      return parseRulesPayload(JSON.parse(decodeURIComponent(param)));
    } catch {
      return [];
    }
  }
}

export function serializeLeadFiltersParam(
  rules: LeadFilterRule[]
): string | null {
  const payload: FilterAstNode[] = rules.flatMap((rule): FilterAstNode[] => {
    if (!rule.field || !rule.operator) {
      return [];
    }

    if (typeof rule.value === 'number') {
      if (!Number.isFinite(rule.value)) {
        return [];
      }

      return [
        {
          field: rule.field,
          operator: rule.operator,
          value: rule.value,
        },
      ];
    }

    const value = String(rule.value ?? '').trim();

    if (!value) {
      return [];
    }

    return [
      {
        field: rule.field,
        operator: rule.operator,
        value,
      },
    ];
  });

  if (payload.length === 0) {
    return null;
  }

  return JSON.stringify(payload);
}

export function LeadFiltersBar({
  initialRules,
  onRulesChange,
  className,
}: LeadFiltersBarProps) {
  const t = useTranslations('Leads');

  const safeTranslate = useCallback(
    (key: string, fallback: string): string => {
      try {
        const translated = t(key as never);
        return translated && translated !== key ? translated : fallback;
      } catch {
        return fallback;
      }
    },
    [t]
  );

  const leadFilterConfig = useMemo<FilterConfig>(
    () => [
      {
        id: 'status',
        label: safeTranslate('form.fields.status.label', 'Status'),
        type: 'select',
        options: STATUS_OPTIONS.map((status) => ({
          value: status,
          label: safeTranslate(`status.${status}`, status),
        })),
      },
      {
        id: 'priority',
        label: safeTranslate('form.fields.priority.label', 'Priority'),
        type: 'select',
        options: PRIORITY_OPTIONS.map((priority) => ({
          value: priority,
          label: safeTranslate(`priority.${priority}`, priority),
        })),
      },
      {
        id: 'first_name',
        label: safeTranslate('form.fields.first_name.label', 'First name'),
        type: 'text',
      },
      {
        id: 'estimated_value',
        label: safeTranslate(
          'form.fields.estimated_value.label',
          'Estimated value'
        ),
        type: 'number',
      },
    ],
    [safeTranslate]
  );

  const handleBuilderChange = useCallback(
    (serializedAst: string) => {
      onRulesChange(parseLeadFiltersParam(serializedAst));
    },
    [onRulesChange]
  );

  return (
    <UniversalFilterBuilder
      config={leadFilterConfig}
      initialRules={initialRules}
      onChange={handleBuilderChange}
      className={className}
    />
  );
}
