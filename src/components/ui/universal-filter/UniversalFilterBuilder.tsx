'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Filter as FilterIcon, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import type {
  FilterAstNode,
  FilterConfig,
  FilterConfigItem,
  FilterFieldType,
  FilterOperator,
  FilterRule,
  FilterRuleValue,
  UniversalFilterBuilderProps,
} from './filter.types';

const OPERATORS_BY_TYPE: Record<FilterFieldType, FilterOperator[]> = {
  text: ['equals', 'not_equals', 'contains'],
  number: ['equals', 'greater_than', 'less_than'],
  date: ['equals', 'greater_than', 'less_than'],
  select: ['equals', 'not_equals'],
};

function createRuleId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getDefaultOperator(type: FilterFieldType): FilterOperator {
  return OPERATORS_BY_TYPE[type][0] ?? 'equals';
}

function getDefaultValue(field: FilterConfigItem): FilterRuleValue {
  if (field.type === 'select') {
    return field.options?.[0]?.value ?? '';
  }

  return '';
}

function createDefaultRule(config: FilterConfig): FilterRule | null {
  const defaultField = config[0];

  if (!defaultField) {
    return null;
  }

  return {
    id: createRuleId(),
    field: defaultField.id,
    operator: getDefaultOperator(defaultField.type),
    value: getDefaultValue(defaultField),
  };
}

function isFilterOperator(value: unknown): value is FilterOperator {
  return (
    value === 'equals' ||
    value === 'not_equals' ||
    value === 'contains' ||
    value === 'greater_than' ||
    value === 'less_than'
  );
}

function normalizeRuleValue(value: unknown): FilterRuleValue {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value === null || value === undefined) {
    return '';
  }

  if (Array.isArray(value)) {
    const firstValue = value.find(
      (entry) => typeof entry === 'string' || typeof entry === 'number'
    );

    if (typeof firstValue === 'number') {
      return Number.isFinite(firstValue) ? firstValue : null;
    }

    if (typeof firstValue === 'string') {
      return firstValue;
    }
  }

  return '';
}

function normalizeInitialRules(
  rules: FilterRule[] | undefined,
  config: FilterConfig
): FilterRule[] {
  if (!rules || rules.length === 0) {
    return [];
  }

  const fieldMap = new Map(config.map((field) => [field.id, field]));

  return rules.flatMap((rule) => {
    const field = fieldMap.get(rule.field);

    if (!field) {
      return [];
    }

    const availableOperators = OPERATORS_BY_TYPE[field.type];
    const operator =
      isFilterOperator(rule.operator) &&
      availableOperators.includes(rule.operator)
        ? rule.operator
        : getDefaultOperator(field.type);

    return [
      {
        id:
          typeof rule.id === 'string' && rule.id.trim()
            ? rule.id
            : createRuleId(),
        field: field.id,
        operator,
        value: normalizeRuleValue(rule.value),
      },
    ];
  });
}

function toAstNodes(
  rules: FilterRule[],
  config: FilterConfig
): FilterAstNode[] {
  const fieldMap = new Map(config.map((field) => [field.id, field]));

  return rules.flatMap((rule): FilterAstNode[] => {
    const field = fieldMap.get(rule.field);

    if (!field) {
      return [];
    }

    const allowedOperators = OPERATORS_BY_TYPE[field.type];
    const operator = allowedOperators.includes(rule.operator)
      ? rule.operator
      : getDefaultOperator(field.type);

    if (field.type === 'number') {
      const parsedNumber =
        typeof rule.value === 'number' ? rule.value : Number(rule.value);

      if (!Number.isFinite(parsedNumber)) {
        return [];
      }

      return [
        {
          field: rule.field,
          operator,
          value: parsedNumber,
        },
      ];
    }

    const stringValue = String(rule.value ?? '').trim();

    if (!stringValue) {
      return [];
    }

    return [
      {
        field: rule.field,
        operator,
        value: stringValue,
      },
    ];
  });
}

function toInputValue(value: FilterRuleValue): string {
  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'string') {
    return value;
  }

  return '';
}

export function UniversalFilterBuilder({
  config,
  initialRules,
  onChange,
  className,
}: UniversalFilterBuilderProps) {
  const t = useTranslations('Leads.filters');
  const [open, setOpen] = useState(false);
  const [rules, setRules] = useState<FilterRule[]>(() =>
    normalizeInitialRules(initialRules, config)
  );

  useEffect(() => {
    setRules(normalizeInitialRules(initialRules, config));
  }, [initialRules, config]);

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

  const fieldMap = useMemo(
    () => new Map(config.map((field) => [field.id, field])),
    [config]
  );

  const addRule = useCallback(() => {
    setRules((prev) => {
      const nextRule = createDefaultRule(config);
      return nextRule ? [...prev, nextRule] : prev;
    });
  }, [config]);

  const removeRule = useCallback((ruleId: string) => {
    setRules((prev) => prev.filter((rule) => rule.id !== ruleId));
  }, []);

  const updateRule = useCallback(
    (ruleId: string, updater: (rule: FilterRule) => FilterRule) => {
      setRules((prev) =>
        prev.map((rule) => (rule.id === ruleId ? updater(rule) : rule))
      );
    },
    []
  );

  const applyRules = useCallback(() => {
    const astNodes = toAstNodes(rules, config);
    onChange(JSON.stringify(astNodes));
    setOpen(false);
  }, [config, onChange, rules]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn('h-8 gap-2', className)}
        >
          <FilterIcon className="h-4 w-4" />
          {safeTranslate('filter', 'Filter')}
          {rules.length > 0 ? (
            <Badge variant="secondary" className="h-5 px-1.5 text-[11px]">
              {rules.length}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[720px] max-w-[95vw] space-y-3 p-3"
      >
        <div className="space-y-2">
          {rules.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {safeTranslate('emptyState', 'No filters added yet.')}
            </p>
          ) : null}

          {rules.map((rule) => {
            const activeField = fieldMap.get(rule.field) ?? config[0];

            if (!activeField) {
              return null;
            }

            const operators = OPERATORS_BY_TYPE[activeField.type];

            return (
              <div
                key={rule.id}
                className="bg-background grid grid-cols-1 items-start gap-2 rounded-md border p-2 md:grid-cols-[1.4fr_1fr_1.6fr_auto]"
              >
                <Select
                  value={rule.field}
                  onValueChange={(nextFieldId) => {
                    const nextField = fieldMap.get(nextFieldId);

                    if (!nextField) {
                      return;
                    }

                    updateRule(rule.id, (currentRule) => ({
                      ...currentRule,
                      field: nextField.id,
                      operator: getDefaultOperator(nextField.type),
                      value: getDefaultValue(nextField),
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={safeTranslate('field', 'Field')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {config.map((field) => (
                      <SelectItem key={field.id} value={field.id}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={rule.operator}
                  onValueChange={(nextOperator) => {
                    if (!isFilterOperator(nextOperator)) {
                      return;
                    }

                    if (!operators.includes(nextOperator)) {
                      return;
                    }

                    updateRule(rule.id, (currentRule) => ({
                      ...currentRule,
                      operator: nextOperator,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={safeTranslate('operator', 'Operator')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((operator) => (
                      <SelectItem key={operator} value={operator}>
                        {safeTranslate(
                          `operators.${operator}`,
                          operator === 'equals'
                            ? 'Equals'
                            : operator === 'not_equals'
                              ? 'Not equals'
                              : operator === 'contains'
                                ? 'Contains'
                                : operator === 'greater_than'
                                  ? 'Greater than'
                                  : 'Less than'
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {activeField.type === 'select' ? (
                  <Select
                    value={toInputValue(rule.value)}
                    onValueChange={(nextValue) => {
                      updateRule(rule.id, (currentRule) => ({
                        ...currentRule,
                        value: nextValue,
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={safeTranslate('value', 'Value')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(activeField.options ?? []).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={
                      activeField.type === 'number'
                        ? 'number'
                        : activeField.type === 'date'
                          ? 'date'
                          : 'text'
                    }
                    value={toInputValue(rule.value)}
                    onChange={(event) => {
                      const nextValue = event.target.value;

                      updateRule(rule.id, (currentRule) => ({
                        ...currentRule,
                        value: nextValue,
                      }));
                    }}
                    placeholder={safeTranslate('value', 'Value')}
                  />
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => removeRule(rule.id)}
                  aria-label={safeTranslate('removeRule', 'Remove rule')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addRule}>
            <Plus className="h-4 w-4" />
            {safeTranslate('addRule', 'Add rule')}
          </Button>

          <Button type="button" size="sm" onClick={applyRules}>
            {safeTranslate('apply', 'Apply')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
