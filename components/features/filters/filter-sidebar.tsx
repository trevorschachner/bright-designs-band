'use client';

import { useState, useEffect } from 'react';
import { Search, X, SortAsc, SortDesc, RotateCcw, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { FilterState, FilterField, SortCondition, FilterPreset } from '@/lib/filters/types';
import { FilterForm } from './filter-form';

interface FilterSidebarProps {
  filterState: FilterState;
  onFilterStateChange: (state: FilterState) => void;
  filterFields: FilterField[];
  presets?: FilterPreset[];
  isLoading?: boolean;
  totalResults?: number;
  isMobile?: boolean;
}

export function FilterSidebar({
  filterState,
  onFilterStateChange,
  filterFields,
  presets = [],
  isLoading = false,
  totalResults,
  isMobile = false
}: FilterSidebarProps) {
  const [searchValue, setSearchValue] = useState(filterState.search || '');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  useEffect(() => {
    setSearchValue(filterState.search || '');
  }, [filterState.search]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchValue !== filterState.search) {
        onFilterStateChange({
          ...filterState,
          search: searchValue || undefined,
          page: 1
        });
      }
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]); // Only run when searchValue changes

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const handleSearchSubmit = () => {
    onFilterStateChange({
      ...filterState,
      search: searchValue || undefined,
      page: 1
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

  const applyPreset = (preset: FilterPreset) => {
    onFilterStateChange({
      ...preset.filters,
      page: 1,
      limit: filterState.limit
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

  const removeFilter = (index: number) => {
    const newConditions = [...filterState.conditions];
    newConditions.splice(index, 1);
    onFilterStateChange({
      ...filterState,
      conditions: newConditions,
      page: 1
    });
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-6 py-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Filters</h2>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount} active
              </Badge>
            )}
          </div>

          <Separator />

          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium">
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="search"
                placeholder="Search shows..."
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
          </div>

          {/* Quick Filters (Presets) */}
          {presets.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quick Filters</Label>
              <div className="flex flex-wrap gap-2">
                {presets.map(preset => (
                  <Badge
                    key={preset.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => applyPreset(preset)}
                  >
                    {preset.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Sort */}
          <div className="space-y-2">
            <Label htmlFor="sort" className="text-sm font-medium">
              Sort By
            </Label>
            <Select
              value={filterState.sort.length > 0 ? `${filterState.sort[0].field}-${filterState.sort[0].direction}` : ''}
              onValueChange={(value) => {
                if (value) {
                  const [field, direction] = value.split('-');
                  handleSortChange(field, direction as 'asc' | 'desc');
                }
              }}
            >
              <SelectTrigger id="sort">
                <SelectValue placeholder="Select sort order...">
                  {filterState.sort.length > 0 ? (
                    <div className="flex items-center gap-2">
                      {filterState.sort[0].direction === 'asc' ? (
                        <SortAsc className="w-4 h-4" />
                      ) : (
                        <SortDesc className="w-4 h-4" />
                      )}
                      {getSortFieldLabel(filterState.sort[0].field)}
                    </div>
                  ) : (
                    'Select sort order...'
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {filterFields
                  .filter(field => ['text', 'number', 'date'].includes(field.type))
                  .map(field => (
                    <div key={field.key}>
                      <SelectItem value={`${field.key}-asc`}>
                        <div className="flex items-center gap-2">
                          <SortAsc className="w-4 h-4" />
                          {field.label} (A-Z)
                        </div>
                      </SelectItem>
                      <SelectItem value={`${field.key}-desc`}>
                        <div className="flex items-center gap-2">
                          <SortDesc className="w-4 h-4" />
                          {field.label} (Z-A)
                        </div>
                      </SelectItem>
                    </div>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Advanced Filters */}
          <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Advanced Filters
                </span>
                {isAdvancedOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <FilterForm
                filterState={filterState}
                onFilterStateChange={onFilterStateChange}
                filterFields={filterFields}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Active Filters */}
          {(filterState.search || filterState.conditions.length > 0 || filterState.sort.length > 0) && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium">Active Filters</Label>
                <div className="flex flex-wrap gap-2">
                  {filterState.search && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Search: "{filterState.search}"
                      <X 
                        className="w-3 h-3 cursor-pointer hover:bg-muted rounded" 
                        onClick={clearSearch}
                      />
                    </Badge>
                  )}
                  {filterState.conditions.map((condition, index) => {
                    const displayValue = Array.isArray(condition.values) 
                      ? condition.values.join(', ')
                      : String(condition.value ?? '');
                    return (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {getFilterFieldLabel(condition.field)} {condition.operator} {displayValue}
                        <X 
                          className="w-3 h-3 cursor-pointer hover:bg-muted rounded" 
                          onClick={() => removeFilter(index)}
                        />
                      </Badge>
                    );
                  })}
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
              </div>
            </>
          )}

          {/* Results Summary */}
          {totalResults !== undefined && (
            <div className="text-sm text-muted-foreground">
              {isLoading ? (
                'Loading...'
              ) : (
                `${totalResults} result${totalResults !== 1 ? 's' : ''} found`
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Clear All Button */}
      {activeFilterCount > 0 && (
        <div className="border-t p-4">
          <Button variant="outline" className="w-full" onClick={clearAllFilters}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );

  // Mobile: Render as Sheet
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full sm:w-auto">
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full sm:w-[400px] p-0">
          <SheetHeader className="px-4 pt-6 pb-4">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Render as fixed sidebar
  return (
    <aside className="w-80 flex-shrink-0 border-r border-border bg-muted/30 sticky top-0 h-screen">
      <SidebarContent />
    </aside>
  );
}

