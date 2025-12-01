'use client';

import { useState, useEffect } from 'react';
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
import { FilterState, FilterField, SortCondition, FilterPreset } from '@/lib/filters/types';

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
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);
  const [isFeaturedOnly, setIsFeaturedOnly] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  // Advanced Filters removed

  // Only sync searchValue with filterState.search when not actively typing
  // This prevents the input from resetting while the user is typing
  useEffect(() => {
    if (!isTyping && filterState.search !== searchValue) {
      setSearchValue(filterState.search || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterState.search, isTyping]); // Removed searchValue from deps to avoid loops

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

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsTyping(false);
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
    setIsTyping(true);
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
    });
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
                              id={`difficulty-${level}`}
                              onCheckedChange={() => handleDifficultyToggle(level)}
                            />
                            <label
                              htmlFor={`difficulty-${level}`}
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

