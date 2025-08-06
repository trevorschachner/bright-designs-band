import { 
  FilterCondition, 
  SortCondition, 
  FilterState, 
  PaginationInfo,
  FilteredResponse 
} from './types';
import { sql, SQL, and, or, eq, ne, gt, gte, lt, lte, like, ilike, isNull, isNotNull, inArray, notInArray, asc, desc } from 'drizzle-orm';
import { PgColumn, PgTable } from 'drizzle-orm/pg-core';

/**
 * Builds Drizzle ORM queries from filter conditions
 */
export class QueryBuilder {
  /**
   * Convert filter operator and value to Drizzle condition
   */
  private static buildCondition(
    column: PgColumn, 
    operator: string, 
    value: any, 
    values?: any[]
  ): SQL {
    switch (operator) {
      case 'equals':
        return eq(column, value);
      case 'contains':
        return ilike(column, `%${value}%`);
      case 'startsWith':
        return ilike(column, `${value}%`);
      case 'endsWith':
        return ilike(column, `%${value}`);
      case 'gt':
        return gt(column, value);
      case 'gte':
        return gte(column, value);
      case 'lt':
        return lt(column, value);
      case 'lte':
        return lte(column, value);
      case 'in':
        return inArray(column, values || [value]);
      case 'notIn':
        return notInArray(column, values || [value]);
      case 'between':
        if (values && values.length >= 2) {
          const condition = and(gte(column, values[0]), lte(column, values[1]));
          if (!condition) {
            throw new Error('Failed to build "between" condition');
          }
          return condition;
        }
        throw new Error('Between operator requires exactly 2 values');
      case 'isNull':
        return isNull(column);
      case 'isNotNull':
        return isNotNull(column);
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  }

  /**
   * Build WHERE clause from filter conditions
   */
  static buildWhereClause(
    table: PgTable,
    conditions: FilterCondition[]
  ): SQL | undefined {
    if (conditions.length === 0) return undefined;

    const sqlConditions = conditions.map(condition => {
      const column = table[condition.field as keyof typeof table] as PgColumn;
      if (!column) {
        throw new Error(`Column ${condition.field} not found in table`);
      }
      
      return this.buildCondition(
        column, 
        condition.operator, 
        condition.value, 
        condition.values
      );
    });

    return sqlConditions.length === 1 
      ? sqlConditions[0] 
      : and(...sqlConditions);
  }

  /**
   * Build ORDER BY clause from sort conditions
   */
  static buildOrderByClause(
    table: PgTable,
    sortConditions: SortCondition[]
  ): SQL[] {
    return sortConditions.map(sort => {
      const column = table[sort.field as keyof typeof table] as PgColumn;
      if (!column) {
        throw new Error(`Column ${sort.field} not found in table`);
      }
      
      return sort.direction === 'asc' ? asc(column) : desc(column);
    });
  }

  /**
   * Build search condition for multiple text fields
   */
  static buildSearchCondition(
    table: PgTable,
    searchTerm: string,
    searchFields: string[]
  ): SQL | undefined {
    if (!searchTerm || searchFields.length === 0) return undefined;

    const searchConditions = searchFields.map(fieldName => {
      const column = table[fieldName as keyof typeof table] as PgColumn;
      if (!column) return null;
      
      return ilike(column, `%${searchTerm}%`);
    }).filter(Boolean) as SQL[];

    return searchConditions.length > 0 
      ? or(...searchConditions) 
      : undefined;
  }

  /**
   * Calculate pagination info
   */
  static calculatePagination(
    total: number,
    page: number = 1,
    limit: number = 20
  ): PaginationInfo {
    const totalPages = Math.ceil(total / limit);
    
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  /**
   * Build complete filter response
   */
  static buildFilteredResponse<T>(
    data: T[],
    total: number,
    filterState: FilterState
  ): FilteredResponse<T> {
    const pagination = this.calculatePagination(
      total,
      filterState.page || 1,
      filterState.limit || 20
    );

    return {
      data,
      pagination,
      appliedFilters: filterState
    };
  }
}

/**
 * URL parameter utilities for filter state
 */
export class FilterUrlManager {
  /**
   * Convert filter state to URL search parameters
   */
  static toUrlParams(filterState: FilterState): URLSearchParams {
    const params = new URLSearchParams();

    if (filterState.search) {
      params.set('search', filterState.search);
    }

    if (filterState.page && filterState.page > 1) {
      params.set('page', filterState.page.toString());
    }

    if (filterState.limit && filterState.limit !== 20) {
      params.set('limit', filterState.limit.toString());
    }

    // Encode filter conditions
    if (filterState.conditions.length > 0) {
      params.set('filters', JSON.stringify(filterState.conditions));
    }

    // Encode sort conditions
    if (filterState.sort.length > 0) {
      params.set('sort', JSON.stringify(filterState.sort));
    }

    return params;
  }

  /**
   * Parse URL search parameters to filter state
   */
  static fromUrlParams(searchParams: URLSearchParams): FilterState {
    const filterState: FilterState = {
      conditions: [],
      sort: []
    };

    const search = searchParams.get('search');
    if (search) {
      filterState.search = search;
    }

    const page = searchParams.get('page');
    if (page) {
      filterState.page = parseInt(page, 10);
    }

    const limit = searchParams.get('limit');
    if (limit) {
      filterState.limit = parseInt(limit, 10);
    }

    const filters = searchParams.get('filters');
    if (filters) {
      try {
        filterState.conditions = JSON.parse(filters);
      } catch (e) {
        console.warn('Failed to parse filters from URL:', e);
      }
    }

    const sort = searchParams.get('sort');
    if (sort) {
      try {
        filterState.sort = JSON.parse(sort);
      } catch (e) {
        console.warn('Failed to parse sort from URL:', e);
      }
    }

    return filterState;
  }

  /**
   * Get URL string from filter state
   */
  static getUrl(baseUrl: string, filterState: FilterState): string {
    const params = this.toUrlParams(filterState);
    const paramString = params.toString();
    return paramString ? `${baseUrl}?${paramString}` : baseUrl;
  }
}