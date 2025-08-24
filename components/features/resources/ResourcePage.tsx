'use client';

import { useState, useEffect, ComponentType } from "react";
import { FilterBar } from "@/components/features/filters/filter-bar";
import { Pagination } from "@/components/features/filters/pagination";
import { useFilterState } from "@/lib/hooks/use-filter-state";
import { FilteredResponse, FilterField, FilterPreset } from "@/lib/filters/types";
import { Button } from "@/components/ui/button";
import { Loader, Users } from "lucide-react";

interface ResourcePageProps<T> {
  resourceName: string;
  apiEndpoint: string;
  filterFields: FilterField[];
  filterPresets: FilterPreset[];
  CardComponent: ComponentType<{ item: T; isLoading?: boolean }>;
  initialLimit?: number;
}

// Local API response envelope type
interface ApiResponse<D> {
  success: boolean;
  data?: D;
  error?: string;
  details?: any;
}

export default function ResourcePage<T>({
  resourceName,
  apiEndpoint,
  filterFields,
  filterPresets,
  CardComponent,
  initialLimit = 12,
}: ResourcePageProps<T>) {
  const { filterState, setFilterState } = useFilterState({
    defaultState: { limit: initialLimit }
  });

  const [response, setResponse] = useState<FilteredResponse<T> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const params = new URLSearchParams();
        if (filterState.search) params.set('search', filterState.search);
        if (filterState.page) params.set('page', filterState.page.toString());
        if (filterState.limit) params.set('limit', filterState.limit.toString());
        if (filterState.conditions.length > 0) params.set('filters', JSON.stringify(filterState.conditions));
        if (filterState.sort.length > 0) params.set('sort', JSON.stringify(filterState.sort));

        const res = await fetch(`${apiEndpoint}?${params.toString()}`);
        if (!res.ok) throw new Error(`Failed to fetch ${resourceName}`);
        
        const json: ApiResponse<FilteredResponse<T>> = await res.json();
        if (!json.success || !json.data) {
          throw new Error(json.error || `Invalid ${resourceName} response`);
        }

        // Unwrap API envelope
        setResponse(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filterState, apiEndpoint, resourceName]);

  const handlePageChange = (page: number) => setFilterState({ ...filterState, page });
  const handleLimitChange = (limit: number) => setFilterState({ ...filterState, limit, page: 1 });

  if (error) {
    return (
      <div className="text-center">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  const items = Array.isArray(response?.data) ? response!.data : [];

  return (
    <div>
      <div className="mb-8">
        <FilterBar
          filterState={filterState}
          onFilterStateChange={setFilterState}
          filterFields={filterFields}
          presets={filterPresets}
          isLoading={isLoading}
          totalResults={response?.pagination?.total}
        />
      </div>

      {isLoading && !response && (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading {resourceName}...</span>
        </div>
      )}

      {response && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {items.map((item: T, index: number) => (
              <CardComponent key={index} item={item} isLoading={isLoading} />
            ))}
          </div>

          {items.length === 0 && !isLoading && (
            <div className="text-center py-20">
              <div className="text-gray-500 mb-4">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No {resourceName} found</h3>
                <p>Try adjusting your filters or search terms.</p>
              </div>
              <Button onClick={() => setFilterState({
                search: undefined,
                conditions: [],
                sort: [],
                page: 1,
                limit: filterState.limit
              })}>
                Clear All Filters
              </Button>
            </div>
          )}

          {items.length > 0 && response.pagination && (
            <Pagination
              pagination={response.pagination}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              isLoading={isLoading}
            />
          )}
        </>
      )}
    </div>
  );
}
