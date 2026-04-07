export type FilterFieldType = 'text' | 'number' | 'date' | 'select';

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'greater_than'
  | 'less_than';

export type FilterRuleValue = string | number | null;

export type FilterOption = {
  value: string;
  label: string;
};

export type FilterConfigItem = {
  id: string;
  label: string;
  type: FilterFieldType;
  options?: FilterOption[];
};

export type FilterConfig = FilterConfigItem[];

export type FilterRule = {
  id: string;
  field: string;
  operator: FilterOperator;
  value: FilterRuleValue;
};

export type FilterAstNode = {
  field: string;
  operator: FilterOperator;
  value: string | number;
};

export type UniversalFilterBuilderProps = {
  config: FilterConfig;
  initialRules?: FilterRule[];
  onChange: (serializedAst: string) => void;
  className?: string;
};
