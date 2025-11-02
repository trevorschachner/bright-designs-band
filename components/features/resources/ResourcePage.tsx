'use client';

import { useState, useEffect, ComponentType } from "react";
import { FilterBar } from "@/components/features/filters/filter-bar";
import { FilterSidebar } from "@/components/features/filters/filter-sidebar";
import { Pagination } from "@/components/features/filters/pagination";
import { useFilterState } from "@/lib/hooks/use-filter-state";
import { FilteredResponse, FilterField, FilterPreset } from "@/lib/filters/types";
import { Button } from "@/components/ui/button";
import { Loader, Users, Grid, List } from "lucide-react";

interface ResourcePageProps<T> {
  resourceName: string;
  apiEndpoint: string;
  filterFields: FilterField[];
  filterPresets: FilterPreset[];
  CardComponent: ComponentType<{ item: T; isLoading?: boolean }>;
  ListComponent?: ComponentType<{ item: T; isLoading?: boolean }>;
  initialLimit?: number;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  useSidebar?: boolean;
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
  ListComponent,
  initialLimit = 12,
  viewMode = 'grid',
  onViewModeChange,
  useSidebar = false,
}: ResourcePageProps<T>) {
  const { filterState, setFilterState } = useFilterState({
    defaultState: { limit: initialLimit }
  });

  const [response, setResponse] = useState<FilteredResponse<T> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Render with sidebar layout
  if (useSidebar) {
    return (
      <div className="flex min-h-screen">
        {/* Sidebar - hidden on mobile, shown on desktop */}
        {!isMobile && (
          <FilterSidebar
            filterState={filterState}
            onFilterStateChange={setFilterState}
            filterFields={filterFields}
            presets={filterPresets}
            isLoading={isLoading}
            totalResults={response?.pagination?.total}
            isMobile={false}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="container mx-auto px-4 py-8">
            {/* Mobile Filter Button */}
            {isMobile && (
              <div className="mb-6">
                <FilterSidebar
                  filterState={filterState}
                  onFilterStateChange={setFilterState}
                  filterFields={filterFields}
                  presets={filterPresets}
                  isLoading={isLoading}
                  totalResults={response?.pagination?.total}
                  isMobile={true}
                />
              </div>
            )}

            {isLoading && !response && (
              <div className="flex items-center justify-center py-20">
                <Loader className="w-8 h-8 animate-spin" />
                <span className="ml-2">Loading {resourceName}...</span>
              </div>
            )}

            {response && (
              <>
                {/* Compact view toggle */}
                <div className="flex items-center justify-end mb-4">
                  <div className="inline-flex items-center gap-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => onViewModeChange && onViewModeChange('grid')}
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => onViewModeChange && onViewModeChange('list')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                    {items.map((item: T, index: number) => (
                      <CardComponent key={index} item={item} isLoading={isLoading} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6 mb-8">
                    {items.map((item: T, index: number) => {
                      const Component = ListComponent || CardComponent;
                      return <Component key={index} item={item} isLoading={isLoading} />;
                    })}
                  </div>
                )}

                {items.length === 0 && !isLoading && (
                  <div className="text-center py-20">
                    <div className="text-muted-foreground mb-4">
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
        </div>
      </div>
    );
  }

  // Original layout without sidebar (for backwards compatibility)
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
              <div className="text-muted-foreground mb-4">
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
