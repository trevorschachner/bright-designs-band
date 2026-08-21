import { getTableColumns } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { FilterField, FieldType, FilterOperator } from './types';

/**
 * Builds the filter fields a table offers, deriving everything about column
 * shape from Drizzle and taking everything about product intent from an
 * explicit allowlist.
 *
 * The split matters. "Which columns exist and what type are they" is something
 * Drizzle already knows, and restating it by hand is what let `type`, `price`
 * and `showId` sit in the arrangements filter list for nine months after those
 * columns stopped existing. "Which columns should a user be allowed to filter
 * on, in what order, described how" is a product decision that nothing can
 * infer, so it stays hand-written.
 *
 * Column keys are constrained to the table's actual columns, so naming a
 * column that does not exist is a type error rather than a runtime 500.
 */

type ColumnKey<T extends PgTable> = Extract<keyof T['_']['columns'], string>;

export interface ColumnFieldSpec<T extends PgTable> {
  key: ColumnKey<T>;
  /** Defaults to the key, de-camel-cased. */
  label?: string;
  description?: string;
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface RelationFieldSpec {
  /**
   * Relation fields name no column, so they resolve only if the route handling
   * the request passes `buildTableQuery` a handler for this key. Offering one
   * without a handler produces a 400 at query time.
   */
  key: string;
  label?: string;
  description?: string;
  placeholder?: string;
}

export interface FilterFieldsSpec<T extends PgTable> {
  columns: ColumnFieldSpec<T>[];
  relations?: RelationFieldSpec[];
}

/**
 * Drizzle's `columnType` is the reliable discriminator here, not `dataType`.
 * `numeric` columns report `dataType: 'string'` because they are carried as
 * strings to avoid float precision loss, and treating price as a text filter
 * would silently drop its range operators.
 */
function fieldTypeOf(columnType: string): FieldType {
  switch (columnType) {
    case 'PgSerial':
    case 'PgInteger':
    case 'PgSmallInt':
    case 'PgBigInt53':
    case 'PgBigInt64':
    case 'PgNumeric':
    case 'PgReal':
    case 'PgDoublePrecision':
      return 'number';
    case 'PgBoolean':
      return 'boolean';
    case 'PgTimestamp':
    case 'PgTimestampString':
    case 'PgDate':
    case 'PgDateString':
    case 'PgTime':
      return 'date';
    case 'PgEnumColumn':
      return 'enum';
    case 'PgArray':
      return 'array';
    default:
      return 'text';
  }
}

const OPERATORS_BY_TYPE: Record<FieldType, FilterOperator[]> = {
  text: ['equals', 'contains', 'startsWith', 'endsWith', 'in', 'notIn', 'isNull', 'isNotNull'],
  number: ['equals', 'gt', 'gte', 'lt', 'lte', 'between', 'in', 'notIn', 'isNull', 'isNotNull'],
  date: ['equals', 'gt', 'gte', 'lt', 'lte', 'between', 'isNull', 'isNotNull'],
  boolean: ['equals', 'isNull', 'isNotNull'],
  enum: ['equals', 'in', 'notIn', 'isNull', 'isNotNull'],
  array: ['contains', 'in', 'notIn', 'isNull', 'isNotNull'],
  relation: ['equals', 'in', 'notIn', 'isNull', 'isNotNull'],
};

function defaultLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/_/g, ' ')
    .trim();
}

export function deriveFilterFields<T extends PgTable>(
  table: T,
  spec: FilterFieldsSpec<T>,
): FilterField[] {
  const columns = getTableColumns(table);

  const columnFields = spec.columns.map(({ key, label, description, placeholder, min, max }) => {
    const column = columns[key as keyof typeof columns] as
      | { columnType: string; enumValues?: readonly string[] }
      | undefined;

    // Unreachable through the type system, but the allowlist is data and this
    // module is the only thing standing between it and a query-time 500.
    if (!column) {
      throw new Error(`Filter field "${key}" is not a column on this table`);
    }

    const type = fieldTypeOf(column.columnType);
    const resolvedLabel = label ?? defaultLabel(key);

    const field: FilterField = {
      key,
      label: resolvedLabel,
      type,
      operators: OPERATORS_BY_TYPE[type],
      placeholder: placeholder ?? `Filter by ${resolvedLabel.toLowerCase()}...`,
    };

    if (type === 'enum' && column.enumValues) {
      field.enumValues = [...column.enumValues];
    }
    if (description !== undefined) field.description = description;
    if (min !== undefined) field.min = min;
    if (max !== undefined) field.max = max;

    return field;
  });

  const relationFields = (spec.relations ?? []).map(({ key, label, description, placeholder }) => {
    const resolvedLabel = label ?? defaultLabel(key);
    const field: FilterField = {
      key,
      label: resolvedLabel,
      type: 'relation',
      operators: OPERATORS_BY_TYPE.relation,
      placeholder: placeholder ?? `Filter by ${resolvedLabel.toLowerCase()}...`,
    };
    if (description !== undefined) field.description = description;
    return field;
  });

  return [...columnFields, ...relationFields];
}
