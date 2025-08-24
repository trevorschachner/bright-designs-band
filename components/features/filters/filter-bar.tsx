'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X, SortAsc, SortDesc, RotateCcw } from 'lucide-react';
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
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { FilterState, FilterField, SortCondition, FilterPreset } from '@/lib/filters/types';
import { FilterForm } from './filter-form';

interface FilterBarProps {
  filterState: FilterState;
  onFilterStateChange: (state: FilterState) => void;
  filterFields: FilterField[];
  presets?: FilterPreset[];
  isLoading?: boolean;
  totalResults?: number;
}

export function FilterBar({
  filterState,
  onFilterStateChange,
  filterFields,
  presets = [],
  isLoading = false,
  totalResults
}: FilterBarProps) {
  const [searchValue, setSearchValue] = useState(filterState.search || '');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Update local search when filterState changes
  useEffect(() => {
    setSearchValue(filterState.search || '');
  }, [filterState.search]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const handleSearchSubmit = () => {
    onFilterStateChange({
      ...filterState,
      search: searchValue || undefined,
      page: 1 // Reset to first page when searching
    });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const clearSearch = () => {
    setSearchValue('');
    onFilterStateChange({
      ...filterState,
      search: undefined,
      page: 1
    });
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
    });
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onBlur={handleSearchSubmit}
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
          {/* Advanced Filters */}
          <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Advanced Filters</SheetTitle>
                <SheetDescription>
                  Create detailed filters to find exactly what you're looking for.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <FilterForm
                  filterState={filterState}
                  onFilterStateChange={onFilterStateChange}
                  filterFields={filterFields}
                  onClose={() => setIsFilterSheetOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>

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
                        <div className="text-xs text-gray-500">{preset.description}</div>
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
                className="w-3 h-3 cursor-pointer hover:bg-gray-200 rounded" 
                onClick={clearSearch}
              />
            </Badge>
          )}

          {/* Filter Condition Badges */}
          {filterState.conditions.map((condition, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {getFilterFieldLabel(condition.field)} {condition.operator} {
                Array.isArray(condition.values) 
                  ? condition.values.join(', ')
                  : condition.value
              }
              <X 
                className="w-3 h-3 cursor-pointer hover:bg-gray-200 rounded" 
                onClick={() => removeFilter(index)}
              />
            </Badge>
          ))}

          {/* Sort Badges */}
          {filterState.sort.map((sort, index) => (
            <Badge key={index} variant="outline" className="flex items-center gap-1">
              Sort: {getSortFieldLabel(sort.field)} ({sort.direction})
              <X 
                className="w-3 h-3 cursor-pointer hover:bg-gray-200 rounded" 
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
      {totalResults !== undefined && (
        <div className="text-sm text-gray-500">
          {isLoading ? (
            'Loading...'
          ) : (
            `${totalResults} result${totalResults !== 1 ? 's' : ''} found`
          )}
        </div>
      )}
    </div>
  );
}