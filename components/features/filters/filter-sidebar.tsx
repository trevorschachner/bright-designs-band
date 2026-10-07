'use client';

import { useState, useEffect, useId, type ReactNode } from 'react';
import { Search, X, SortAsc, SortDesc, RotateCcw, Filter } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { FilterField, FilterState, SortCondition, FilterPreset } from '@/lib/filters/types';
import { useCatalogUrlState } from '@/lib/hooks/use-catalog-url-state';
import { normalizeSearch } from '@/lib/filters/catalog-params';

interface FilterSidebarProps {
  /** The allowlist from lib/filters/filter-definitions.ts, passed from the server page. */
  filterFields: FilterField[];
  presets?: FilterPreset[];
  /**
   * The result count, rendered by the server inside its own Suspense boundary
   * (the sidebar renders before the list's data is in).
   */
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
  isMobile?: boolean;
}

/**
 * The catalog's filter controls. State lives in the URL (useCatalogUrlState):
 * every control writes there, after one 300 ms debounce, and the server page
 * re-renders the list. Reads useSearchParams, so the page must render it
 * inside a <Suspense> boundary.
 */
export function FilterSidebar({
  filterFields,
  presets = [],
  resultCount,
  defaultLimit,
  filterState: controlledState,
  onFilterStateChange: controlledChange,
  totalResults,
  isLoading = false,
  isMobile = false
}: FilterSidebarProps) {
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
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);
  const [isFeaturedOnly, setIsFeaturedOnly] = useState(false);
  // The desktop sidebar and the mobile sheet are both mounted (a CSS
  // breakpoint picks one), so every id is prefixed per instance.
  const idPrefix = useId();
  const ids = {
    search: `${idPrefix}-search`,
    sort: `${idPrefix}-sort`,
    difficulty: (level: string) => `${idPrefix}-difficulty-${level}`,
  };

  // Follow the URL (back/forward, a chip removed elsewhere) unless the user is
  // mid-edit: then the box keeps what they typed.
  // Compare normalised: the URL stores `gold` for a box reading `gold `, and
  // overwriting the box with it would eat the space the user just typed.
  useEffect(() => {
    if (hasPendingChange()) return;
    setSearchValue((current) =>
      (normalizeSearch(current) ?? '') === (filterState.search ?? '') ? current : filterState.search || ''
    );
  }, [filterState.search, hasPendingChange]);

  useEffect(() => {
    const difficultyCond = filterState.conditions.find(c => c.field === 'difficulty');
    if (difficultyCond) {
      if (difficultyCond.operator === 'in' && Array.isArray(difficultyCond.values)) {
        setSelectedDifficulty(difficultyCond.values as string[]);
      } else if (difficultyCond.operator === 'equals' && typeof difficultyCond.value === 'string') {
        setSelectedDifficulty([difficultyCond.value]);
      } else {
        setSelectedDifficulty([]);
      }
    } else {
      setSelectedDifficulty([]);
    }

    const featuredCond = filterState.conditions.find(c => c.field === 'featured');
    setIsFeaturedOnly(featuredCond?.value === true);
  }, [filterState.conditions]);

  // One debounce, in useCatalogUrlState. The box used to add its own 400 ms
  // on top of the URL hook's 300 ms.
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

  const applyPreset = (preset: FilterPreset) => {
    onFilterStateChange({
      ...preset.filters,
      page: 1,
      limit: filterState.limit
    });
  };

  const applyCuratedConditions = (updates?: {
    difficulty?: string[];
    featured?: boolean;
  }) => {
    const difficultyValues = updates?.difficulty ?? selectedDifficulty;
    const featuredValue = updates?.featured ?? isFeaturedOnly;

    const baseConditions = filterState.conditions.filter(
      c => !['difficulty', 'featured'].includes(String(c.field))
    );

    const nextConditions = [...baseConditions];

    if (difficultyValues.length > 0) {
      nextConditions.push({ field: 'difficulty', operator: 'in', values: difficultyValues } as any);
    }

    if (featuredValue) {
      nextConditions.push({ field: 'featured', operator: 'equals', value: true } as any);
    }

    onFilterStateChange({ ...filterState, conditions: nextConditions, page: 1 });
  };

  const handleDifficultyToggle = (level: string) => {
    const current = new Set(selectedDifficulty);
    if (current.has(level)) {
      current.delete(level);
    } else {
      current.add(level);
    }
    const updated = Array.from(current);
    setSelectedDifficulty(updated);
    applyCuratedConditions({ difficulty: updated });
  };

  const handleFeaturedToggle = (value: boolean) => {
    setIsFeaturedOnly(value);
    applyCuratedConditions({ featured: value });
  };

  const clearCuratedFilters = () => {
    setSelectedDifficulty([]);
    setIsFeaturedOnly(false);
    applyCuratedConditions({ difficulty: [], featured: false });
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
    setSelectedDifficulty([]);
    setIsFeaturedOnly(false);
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

  // Held as an element, not declared as a component. Declaring it as a component
  // here gave it a new function identity on every render, so React saw a new
  // type, tore down the whole sidebar and rebuilt it. The search input was
  // destroyed and re-created on the first keystroke, which dropped focus and
  // sent every character after it to the document body.
  const sidebarContent = (
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
            <Label htmlFor={ids.search} className="text-sm font-medium">
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id={ids.search}
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

          <Separator />

          {/* Common Filters (curated) */}
          {(() => {
            const hasDifficulty = filterFields.some(f => f.key === 'difficulty');
            const hasFeatured = filterFields.some(f => f.key === 'featured');
            const curatedActive = filterState.conditions.some(c => ['difficulty','featured'].includes(String(c.field)));

            return (hasDifficulty || hasFeatured) ? (
              <div className="space-y-6">
                {hasDifficulty && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Difficulty</Label>
                      {(() => {
                        const difficultyField = filterFields.find(f => f.key === 'difficulty');
                        return difficultyField?.description ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-xs">{difficultyField.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : null;
                      })()}
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {['Beginner','Intermediate','Advanced'].map((level) => {
                        const checked = selectedDifficulty.includes(level);
                        
                        return (
                          <div
                            key={level}
                            className={`flex items-center gap-3 text-sm rounded-md border px-3 py-2 transition-colors ${
                              checked ? 'border-primary bg-primary/5 text-primary' : 'border-border'
                            }`}
                          >
                            <Checkbox
                              checked={checked}
                              id={ids.difficulty(level)}
                              onCheckedChange={() => handleDifficultyToggle(level)}
                            />
                            <label
                              htmlFor={ids.difficulty(level)}
                              className="flex-1 select-none cursor-pointer"
                            >
                              {level}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {hasFeatured && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Featured</Label>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Only show featured</span>
                      <Switch
                        checked={isFeaturedOnly}
                        onCheckedChange={handleFeaturedToggle}
                      />
                    </div>
                  </div>
                )}

                {curatedActive && (
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={clearCuratedFilters}
                    >
                      Clear curated filters
                    </Button>
                  </div>
                )}
              </div>
            ) : null;
          })()}

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
            <Label htmlFor={ids.sort} className="text-sm font-medium">
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
              <SelectTrigger id={ids.sort}>
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
                  .filter(field => {
                    // Only include text, number, and date fields
                    // Exclude price and displayOrder
                    return ['text', 'number', 'date'].includes(field.type) && 
                           !['price', 'displayOrder'].includes(field.key);
                  })
                  .map(field => {
                    // For number and date fields, use "Ascending/Descending"
                    // For text fields, use "A-Z/Z-A"
                    const isNumericOrDate = ['number', 'date'].includes(field.type);
                    const ascLabel = isNumericOrDate ? 'Ascending' : 'A-Z';
                    const descLabel = isNumericOrDate ? 'Descending' : 'Z-A';
                    
                    return (
                      <div key={field.key}>
                        <SelectItem value={`${field.key}-asc`}>
                          <div className="flex items-center gap-2">
                            <SortAsc className="w-4 h-4" />
                            {field.label} ({ascLabel})
                          </div>
                        </SelectItem>
                        <SelectItem value={`${field.key}-desc`}>
                          <div className="flex items-center gap-2">
                            <SortDesc className="w-4 h-4" />
                            {field.label} ({descLabel})
                          </div>
                        </SelectItem>
                      </div>
                    );
                  })}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Advanced Filters removed */}

          {/* Active Filters */}
          {(filterState.search || filterState.conditions.length > 0 || filterState.sort.length > 0) && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium">Active Filters</Label>
                <div className="flex flex-wrap gap-2">
                  {filterState.search && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Search: &quot;{filterState.search}&quot;
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
          {countLabel !== undefined && (
            <div className="text-sm text-muted-foreground">
              {isPending ? 'Loading...' : countLabel}
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
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Render as fixed sidebar
  return (
    <aside className="w-80 flex-shrink-0 border-r border-border bg-muted/30 sticky top-0 h-screen">
      {sidebarContent}
    </aside>
  );
}

