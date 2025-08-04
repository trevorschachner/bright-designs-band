export type FilterOperator = 
  | 'equals'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'notIn'
  | 'between'
  | 'isNull'
  | 'isNotNull';

export type SortDirection = 'asc' | 'desc';

export type FieldType = 
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'enum'
  | 'array'
  | 'relation';

export interface FilterField {
  key: string;
  label: string;
  type: FieldType;
  operators: FilterOperator[];
  enumValues?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
  values?: any[]; // For 'in', 'notIn', 'between' operators
}

export interface SortCondition {
  field: string;
  direction: SortDirection;
}

export interface FilterState {
  search?: string;
  conditions: FilterCondition[];
  sort: SortCondition[];
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface FilteredResponse<T> {
  data: T[];
  pagination: PaginationInfo;
  appliedFilters: FilterState;
}

// Schema-based field configurations
export interface SchemaField {
  key: string;
  type: string;
  nullable?: boolean;
  enumValues?: string[];
  references?: {
    table: string;
    field: string;
  };
}

export interface TableSchema {
  name: string;
  fields: Record<string, SchemaField>;
  relations: Record<string, {
    type: 'one' | 'many';
    table: string;
    fields: string[];
  }>;
}

// Preset filter configurations for common use cases
export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterState;
  description?: string;
}