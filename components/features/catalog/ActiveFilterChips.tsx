'use client';

import { Button } from '@/components/ui/button';
import type { FilterField } from '@/lib/filters/types';
import { useCatalogUrlState } from '@/lib/hooks/use-catalog-url-state';

/**
 * The removable chips above the show grid (search, conditions, sort, clear
 * all). Each removal writes the URL at once; the server renders the new list.
 * Reads useSearchParams: render inside <Suspense>.
 */
export function ActiveFilterChips({ filterFields, defaultLimit }: { filterFields: FilterField[]; defaultLimit?: number }) {
  const { filterState, setFilterState } = useCatalogUrlState({ filterFields, defaultLimit });
  const set = (next: typeof filterState) => setFilterState(next, { immediate: true });

  if (!filterState.search && filterState.conditions.length === 0 && filterState.sort.length === 0) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {filterState.search && (
        <Button
          variant="secondary"
          size="sm"
          className="h-8"
          onClick={() => set({ ...filterState, search: undefined, page: 1 })}
        >
          Search: {filterState.search}
          <span className="ml-2">×</span>
        </Button>
      )}

      {filterState.conditions.map((condition, index) => {
        const displayValue = Array.isArray(condition.values)
          ? condition.values.join(', ')
          : String(condition.value ?? '');
        return (
          <Button
            key={`${condition.field}-${index}`}
            variant="secondary"
            size="sm"
            className="h-8"
            onClick={() =>
              set({ ...filterState, conditions: filterState.conditions.filter((_, i) => i !== index), page: 1 })
            }
          >
            {condition.field}: {displayValue}
            <span className="ml-2">×</span>
          </Button>
        );
      })}

      {filterState.sort.map((sort, index) => (
        <Button
          key={`sort-${index}`}
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => set({ ...filterState, sort: filterState.sort.filter((_, i) => i !== index), page: 1 })}
        >
          Sort: {sort.field} ({sort.direction})
          <span className="ml-2">×</span>
        </Button>
      ))}

      <Button
        variant="ghost"
        size="sm"
        className="h-8"
        onClick={() => set({ search: undefined, conditions: [], sort: [], page: 1, limit: filterState.limit })}
      >
        Clear all
      </Button>
    </div>
  );
}
