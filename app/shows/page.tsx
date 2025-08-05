'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Users, Loader } from "lucide-react";
import { FilterBar } from "@/components/features/filters/filter-bar";
import { Pagination } from "@/components/features/filters/pagination";
import { useFilterState } from "@/lib/hooks/use-filter-state";
import { SHOWS_FILTER_FIELDS } from "@/lib/filters/schema-analyzer";
import { SHOWS_PRESETS } from "@/lib/filters/presets";
import { FilteredResponse } from "@/lib/filters/types";

interface Show {
  id: number;
  title: string;
  year?: string;
  description?: string;
  thumbnailUrl?: string;
  difficulty?: string;
  duration?: string;
  price?: string;
  createdAt: string;
  showsToTags?: Array<{
    tag: {
      id: number;
      name: string;
    };
  }>;
  arrangements?: Array<{
    id: number;
    title: string;
    type?: string;
  }>;
}

export default function ShowsPage() {
  const { filterState, setFilterState } = useFilterState({
    defaultState: {
      limit: 12 // Show more items per page for grid layout
    }
  });

  const [showsResponse, setShowsResponse] = useState<FilteredResponse<Show> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch shows based on filter state
  useEffect(() => {
    const fetchShows = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Build query parameters
        const params = new URLSearchParams();
        
        if (filterState.search) {
          params.set('search', filterState.search);
        }
        
        if (filterState.page) {
          params.set('page', filterState.page.toString());
        }
        
        if (filterState.limit) {
          params.set('limit', filterState.limit.toString());
        }
        
        if (filterState.conditions.length > 0) {
          params.set('filters', JSON.stringify(filterState.conditions));
        }
        
        if (filterState.sort.length > 0) {
          params.set('sort', JSON.stringify(filterState.sort));
        }

        const response = await fetch(`/api/shows?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch shows');
        }
        
        const data: FilteredResponse<Show> = await response.json();
        setShowsResponse(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching shows:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShows();
  }, [filterState]);

  const handlePageChange = (page: number) => {
    setFilterState({
      ...filterState,
      page
    });
  };

  const handleLimitChange = (limit: number) => {
    setFilterState({
      ...filterState,
      limit,
      page: 1 // Reset to first page when changing limit
    });
  };

  if (error) {
    return (
      <div className="container mx-auto py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Show Catalog</h1>
          <div className="text-red-600 mb-4">Error: {error}</div>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-20">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-8">Show Catalog</h1>
        
        {/* Filter Bar */}
        <FilterBar
          filterState={filterState}
          onFilterStateChange={setFilterState}
          filterFields={SHOWS_FILTER_FIELDS}
          presets={SHOWS_PRESETS}
          isLoading={isLoading}
          totalResults={showsResponse?.pagination.total}
        />
      </div>

      {/* Loading State */}
      {isLoading && !showsResponse && (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading shows...</span>
        </div>
      )}

      {/* Shows Grid */}
      {showsResponse && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {showsResponse.data.map((show) => (
              <Card
                key={show.id}
                className={`group hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1 bg-white/80 backdrop-blur-sm ${
                  isLoading ? 'opacity-50' : ''
                }`}
              >
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={show.thumbnailUrl || "/placeholder.svg"}
                    alt={show.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Button
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 text-gray-900 hover:bg-white"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl group-hover:text-bright-third transition-colors font-primary">
                      {show.title}
                    </CardTitle>
                    <Badge className="text-xs">
                      {show.year}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm line-clamp-2">
                    {show.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {show.difficulty || 'Not specified'}
                    </span>
                    <span>{show.duration || 'TBD'}</span>
                  </div>
                  
                  {/* Price */}
                  {show.price && (
                    <div className="mb-4">
                      <span className="text-lg font-semibold text-green-600">
                        ${show.price}
                      </span>
                    </div>
                  )}
                  
                  {/* Tags */}
                  {show.showsToTags && show.showsToTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {show.showsToTags.slice(0, 3).map((st) => (
                        <Badge key={st.tag.id} className="text-xs">
                          {st.tag.name}
                        </Badge>
                      ))}
                      {show.showsToTags.length > 3 && (
                        <Badge className="text-xs">
                          +{show.showsToTags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {/* Arrangements Count */}
                  {show.arrangements && show.arrangements.length > 0 && (
                    <div className="text-xs text-gray-500 mb-4">
                      {show.arrangements.length} arrangement{show.arrangements.length !== 1 ? 's' : ''} available
                    </div>
                  )}
                  
                  <Button className="btn-primary w-full" asChild>
                    <Link href={`/shows/${show.id}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {showsResponse.data.length === 0 && !isLoading && (
            <div className="text-center py-20">
              <div className="text-gray-500 mb-4">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No shows found</h3>
                <p>Try adjusting your filters or search terms.</p>
              </div>
              <Button 
                onClick={() => setFilterState({
                  search: undefined,
                  conditions: [],
                  sort: [],
                  page: 1,
                  limit: filterState.limit
                })}
              >
                Clear All Filters
              </Button>
            </div>
          )}

          {/* Pagination */}
          {showsResponse.data.length > 0 && (
            <Pagination
              pagination={showsResponse.pagination}
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
