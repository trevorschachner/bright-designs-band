'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { Search, X, SortAsc, SortDesc, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { FilterField, FilterState, SortCondition, FilterPreset } from '@/lib/filters/types';
import { useCatalogUrlState } from '@/lib/hooks/use-catalog-url-state';

interface FilterBarProps {
  /** The allowlist from lib/filters/filter-definitions.ts, passed from the server page. */
  filterFields: FilterField[];
  presets?: FilterPreset[];
  /** The result count, server-rendered in its own Suspense boundary. */
  resultCount?: ReactNode;
  defaultLimit?: number;
  /**
   * Legacy controlled mode, kept only for the unused
   * components/features/resources/ResourcePage.tsx. When both are given the
   * component reports changes instead of writing the URL.
   */
  filterState?: FilterState;
  onFilterStateChange?: (state: FilterState) => void;
  /** Legacy: a plain count instead of `resultCount`. */
  totalResults?: number;
  isLoading?: boolean;
}

/**
 * Inline catalog filters (search, sort, active chips). Same URL contract as
 * FilterSidebar: one 300 ms debounce, then router.replace. Reads
 * useSearchParams, so render it inside a <Suspense> boundary.
 */
export function FilterBar({
  filterFields,
  presets = [],
  resultCount,
  defaultLimit,
  filterState: controlledState,
  onFilterStateChange: controlledChange,
  totalResults,
  isLoading = false,
}: FilterBarProps) {
  const url = useCatalogUrlState({ filterFields, defaultLimit });
  const controlled = Boolean(controlledState && controlledChange);
  const filterState = controlled ? controlledState! : url.filterState;
  const onFilterStateChange = (next: FilterState, options?: { immediate?: boolean }) =>
    controlled ? controlledChange!(next) : url.setFilterState(next, options);
  const { hasPendingChange } = url;
  const isPending = url.isPending || isLoading;
  const countLabel =
    resultCount ?? (totalResults !== undefined ? `${totalResults} result${totalResults !== 1 ? 's' : ''} found` : undefined);
  const [searchValue, setSearchValue] = useState(filterState.search || '');

  // Follow the URL unless the user is mid-edit.
  useEffect(() => {
    if (!hasPendingChange()) {
      setSearchValue(filterState.search || '');
    }
  }, [filterState.search, hasPendingChange]);

  // One debounce, in useCatalogUrlState (the box used to add its own 400 ms).
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onFilterStateChange({ ...filterState, search: value || undefined, page: 1 });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onFilterStateChange(
        { ...filterState, search: (e.target as HTMLInputElement).value || undefined, page: 1 },
        { immediate: true }
      );
    }
  };

  const clearSearch = () => {
    setSearchValue('');
    onFilterStateChange({
      ...filterState,
      search: undefined,
      page: 1
    }, { immediate: true });
  };

  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    const newSort: SortCondition[] = [{ field, direction }];
    onFilterStateChange({
      ...filterState,
      sort: newSort,
      page: 1
    });
  };

  const removeFilter = (index: number) => {
    const newConditions = [...filterState.conditions];
    newConditions.splice(index, 1);
    onFilterStateChange({
      ...filterState,
      conditions: newConditions,
      page: 1
    });
  };

  const clearAllFilters = () => {
    onFilterStateChange({
      search: undefined,
      conditions: [],
      sort: [],
      page: 1,
      limit: filterState.limit
    }, { immediate: true });
    setSearchValue('');
  };

  const applyPreset = (preset: FilterPreset) => {
    onFilterStateChange({
      ...preset.filters,
      page: 1,
      limit: filterState.limit
    });
  };

  const activeFilterCount = filterState.conditions.length + 
    (filterState.search ? 1 : 0) + 
    filterState.sort.length;

  const getSortFieldLabel = (fieldKey: string) => {
    const field = filterFields.find(f => f.key === fieldKey);
    return field?.label || fieldKey;
  };

  const getFilterFieldLabel = (fieldKey: string) => {
    const field = filterFields.find(f => f.key === fieldKey);
    return field?.label || fieldKey;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-10 pr-10"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex gap-2">

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {filterState.sort.length > 0 ? (
                  filterState.sort[0].direction === 'asc' ? (
                    <SortAsc className="w-4 h-4 mr-2" />
                  ) : (
                    <SortDesc className="w-4 h-4 mr-2" />
                  )
                ) : (
                  <SortAsc className="w-4 h-4 mr-2" />
                )}
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {filterFields
                .filter(field => ['text', 'number', 'date'].includes(field.type))
                .map(field => (
                  <div key={field.key}>
                    <DropdownMenuItem onClick={() => handleSortChange(field.key, 'asc')}>
                      <SortAsc className="w-4 h-4 mr-2" />
                      {field.label} (A-Z)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSortChange(field.key, 'desc')}>
                      <SortDesc className="w-4 h-4 mr-2" />
                      {field.label} (Z-A)
                    </DropdownMenuItem>
                  </div>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Presets Dropdown */}
          {presets.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Presets
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Quick Filters</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {presets.map(preset => (
                  <DropdownMenuItem key={preset.id} onClick={() => applyPreset(preset)}>
                    <div>
                      <div className="font-medium">{preset.name}</div>
                      {preset.description && (
                        <div className="text-xs text-muted-foreground">{preset.description}</div>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Clear All */}
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {(filterState.search || filterState.conditions.length > 0 || filterState.sort.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {/* Search Badge */}
          {filterState.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: &quot;{filterState.search}&quot;
              <X 
                className="w-3 h-3 cursor-pointer hover:bg-muted rounded" 
                onClick={clearSearch}
              />
            </Badge>
          )}

          {/* Filter Condition Badges */}
          {filterState.conditions.map((condition, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {getFilterFieldLabel(condition.field)} {condition.operator} {
                Array.isArray(condition.values)
                  ? (condition.values as unknown[]).map(String).join(', ')
                  : String(condition.value ?? '')
              }
              <X 
                className="w-3 h-3 cursor-pointer hover:bg-muted rounded" 
                onClick={() => removeFilter(index)}
              />
            </Badge>
          ))}

          {/* Sort Badges */}
          {filterState.sort.map((sort, index) => (
            <Badge key={index} variant="outline" className="flex items-center gap-1">
              Sort: {getSortFieldLabel(sort.field)} ({sort.direction})
              <X 
                className="w-3 h-3 cursor-pointer hover:bg-muted rounded" 
                onClick={() => onFilterStateChange({
                  ...filterState,
                  sort: filterState.sort.filter((_, i) => i !== index),
                  page: 1
                })}
              />
            </Badge>
          ))}
        </div>
      )}

      {/* Results Summary */}
      {countLabel !== undefined && (
        <div className="text-sm text-muted-foreground">
          {isPending ? 'Loading...' : countLabel}
        </div>
      )}
    </div>
  );
}