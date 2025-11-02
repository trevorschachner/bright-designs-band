'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Music, Users, Loader, Play, FileText } from "lucide-react";
import { FilterBar } from "@/components/features/filters/filter-bar";
import { Pagination } from "@/components/features/filters/pagination";
import { useFilterState } from "@/lib/hooks/use-filter-state";
import { ARRANGEMENTS_FILTER_FIELDS } from "@/lib/filters/schema-analyzer";
import { ARRANGEMENTS_PRESETS } from "@/lib/filters/presets";
import { FilteredResponse } from "@/lib/filters/types";

interface ArrangementFile { id: number; fileType: string; url: string }
interface Arrangement {
  id: number;
  title?: string;
  composer?: string | null;
  sample_score_url?: string | null; // API may not camelCase
  sampleScoreUrl?: string | null;
  duration_seconds?: number | null;
  durationSeconds?: number | null;
  files?: ArrangementFile[];
}

export default function ArrangementsPage() {
  const { filterState, setFilterState } = useFilterState({
    defaultState: {
      limit: 12 // Show more items per page for grid layout
    }
  });

  const [arrangementsResponse, setArrangementsResponse] = useState<FilteredResponse<Arrangement> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch arrangements based on filter state
  useEffect(() => {
    const fetchArrangements = async () => {
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

        const response = await fetch(`/api/arrangements?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch arrangements');
        }
        
        const data: FilteredResponse<Arrangement> = await response.json();
        setArrangementsResponse(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching arrangements:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArrangements();
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
          <h1 className="text-4xl font-bold mb-4">Arrangements</h1>
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
        <h1 className="text-4xl font-bold text-center mb-8">Arrangements</h1>
        
        {/* Filter Bar */}
        <FilterBar
          filterState={filterState}
          onFilterStateChange={setFilterState}
          filterFields={ARRANGEMENTS_FILTER_FIELDS}
          presets={ARRANGEMENTS_PRESETS}
          isLoading={isLoading}
          totalResults={arrangementsResponse?.pagination.total}
        />
      </div>

      {/* Loading State */}
      {isLoading && !arrangementsResponse && (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading arrangements...</span>
        </div>
      )}

      {/* Arrangements Grid */}
      {arrangementsResponse && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {arrangementsResponse.data.map((arrangement) => {
              const title = arrangement.title || 'Arrangement'
              const composer = arrangement.composer
              const duration = (arrangement.durationSeconds ?? arrangement.duration_seconds) as number | undefined
              const files = arrangement.files || []
              const audio = files.find(f => f.fileType === 'audio')
              const sampleScore = (arrangement.sampleScoreUrl ?? (arrangement as any).sample_score_url) as string | undefined
              const formatSeconds = (total?: number) => {
                if (!total || total < 0) return '—'
                const m = Math.floor(total / 60)
                const s = total % 60
                return `${m}:${String(s).padStart(2, '0')}`
              }
              return (
              <Card
                key={arrangement.id}
                className={`frame-card ${
                  isLoading ? 'opacity-50' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-xl font-primary flex-1">
                      {title}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    <div className="flex items-center gap-2">
                      {composer ? (
                        <>
                          <Music className="w-4 h-4" />
                          <span>Composer: {composer}</span>
                        </>
                      ) : null}
                      <span className="ml-2 text-bright-primary">{formatSeconds(duration)}</span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                        <Play className="w-4 h-4" />
                        Audio Preview
                      </div>
                      {audio ? (
                        <audio controls className="w-full h-10 rounded-lg" preload="metadata">
                          <source src={audio.url} />
                        </audio>
                      ) : (
                        <div className="text-xs text-muted-foreground">No audio preview available.</div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sampleScore ? (
                        <Button variant="outline" className="flex-1 sm:flex-none" asChild>
                          <Link href={sampleScore} target="_blank" rel="noopener noreferrer">
                            <FileText className="w-4 h-4 mr-2" /> Sample Score
                          </Link>
                        </Button>
                      ) : null}
                      <Button className="btn-primary flex-1 sm:flex-none" asChild>
                        <Link href={`/arrangements/${arrangement.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )})}
          </div>

          {/* Empty State */}
          {arrangementsResponse.data.length === 0 && !isLoading && (
            <div className="text-center py-20">
              <div className="text-muted-foreground mb-4">
                <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No arrangements found</h3>
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
          {arrangementsResponse.data.length > 0 && (
            <Pagination
              pagination={arrangementsResponse.pagination}
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
