'use client';

import { useCallback, useMemo } from 'react';
import { ArrowUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UniversalFilterBuilder } from '@/components/ui/universal-filter/UniversalFilterBuilder';
import type {
  FilterAstNode,
  FilterConfig,
  FilterOperator,
  FilterRule,
} from '@/components/ui/universal-filter/filter.types';

type ProductFiltersBarProps = {
  initialRules: ProductFilterRule[];
  onRulesChange: (rules: ProductFilterRule[]) => void;
  sortBy: 'title' | 'base_price' | 'created_at' | null;
  sortDir: 'asc' | 'desc' | null;
  onSortChange: (
    field: 'title' | 'base_price' | 'created_at' | null,
    direction: 'asc' | 'desc' | null
  ) => void;
  className?: string;
};

export type ProductFilterRule = FilterRule;
type ProductSortField = 'title' | 'base_price' | 'created_at';

const SORT_FIELD_OPTIONS: Array<{ value: ProductSortField; label: string }> = [
  { value: 'title', label: 'Title' },
  { value: 'base_price', label: 'Price' },
  { value: 'created_at', label: 'Created Date' },
];

const PRODUCT_TYPE_OPTIONS = [
  { value: 'REAL_ESTATE_ASSET', label: 'Real Estate' },
  { value: 'SCHEDULED_EVENT', label: 'Scheduled Event' },
  { value: 'RESOURCE_RENTAL', label: 'Resource Rental' },
  { value: 'DYNAMIC_SERVICE', label: 'Dynamic Service' },
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'TRY', label: 'TRY' },
  { value: 'GBP', label: 'GBP' },
];

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

function parseRulesPayload(payload: unknown): ProductFilterRule[] {
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

export function parseProductFiltersParam(
  param: string | null
): ProductFilterRule[] {
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

export function serializeProductFiltersParam(
  rules: ProductFilterRule[]
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

export function ProductFiltersBar({
  initialRules,
  onRulesChange,
  sortBy,
  sortDir,
  onSortChange,
  className,
}: ProductFiltersBarProps) {
  const productFilterConfig = useMemo<FilterConfig>(
    () => [
      {
        id: 'title',
        label: 'Title',
        type: 'text',
      },
      {
        id: 'type',
        label: 'Product Type',
        type: 'select',
        options: PRODUCT_TYPE_OPTIONS,
      },
      {
        id: 'base_price',
        label: 'Base Price',
        type: 'number',
      },
      {
        id: 'currency',
        label: 'Currency',
        type: 'select',
        options: CURRENCY_OPTIONS,
      },
    ],
    []
  );

  const handleBuilderChange = useCallback(
    (serializedAst: string) => {
      onRulesChange(parseProductFiltersParam(serializedAst));
    },
    [onRulesChange]
  );

  const handleSortFieldChange = useCallback(
    (field: string) => {
      if (field === 'none') {
        onSortChange(null, null);
        return;
      }

      const nextField = field as ProductSortField;
      const nextDirection = nextField === sortBy ? (sortDir ?? 'asc') : 'asc';

      onSortChange(nextField, nextDirection);
    },
    [sortBy, sortDir, onSortChange]
  );

  const handleSortDirectionChange = useCallback(
    (direction: string) => {
      if (!sortBy) {
        return;
      }

      onSortChange(sortBy, direction as 'asc' | 'desc');
    },
    [sortBy, onSortChange]
  );

  const handleClearSort = useCallback(() => {
    onSortChange(null, null);
  }, [onSortChange]);

  const sortSummary = useMemo(() => {
    if (!sortBy || !sortDir) {
      return 'No sorting applied';
    }

    const fieldLabel =
      SORT_FIELD_OPTIONS.find((option) => option.value === sortBy)?.label ??
      'Title';
    const directionLabel = sortDir === 'asc' ? 'Ascending' : 'Descending';

    return `${fieldLabel} (${directionLabel})`;
  }, [sortBy, sortDir]);

  return (
    <div className="space-y-4">
      <UniversalFilterBuilder
        config={productFilterConfig}
        initialRules={initialRules}
        onChange={handleBuilderChange}
        className={className}
      />

      <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
            <ArrowUpDown className="h-4 w-4 text-zinc-400" />
            Sort Results
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={sortBy ?? 'none'}
              onValueChange={handleSortFieldChange}
            >
              <SelectTrigger className="h-9 w-42.5 border-zinc-700 bg-zinc-950 text-zinc-100">
                <SelectValue placeholder="Sort field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No sorting</SelectItem>
                {SORT_FIELD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sortDir ?? undefined}
              onValueChange={handleSortDirectionChange}
              disabled={!sortBy}
            >
              <SelectTrigger className="h-9 w-35 border-zinc-700 bg-zinc-950 text-zinc-100 disabled:opacity-50">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>

            {sortBy && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearSort}
                className="h-9 border border-zinc-700 px-3 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>

        <p className="mt-2 text-xs text-zinc-400">
          Current sort: {sortSummary}
        </p>
      </div>
    </div>
  );
}
