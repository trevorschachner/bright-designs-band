'use client';

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Music, Loader, FileText, ExternalLink, Play, ChevronDown } from "lucide-react";
import { FilterBar } from "@/components/features/filters/filter-bar";
import { Pagination } from "@/components/features/filters/pagination";
import { useFilterState } from "@/lib/hooks/use-filter-state";
import { ARRANGEMENTS_FILTER_FIELDS } from "@/lib/filters/schema-analyzer";
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
  showArrangements?: { show: { id: number; title: string; slug: string } }[];
}

export default function ArrangementsPage() {
  const { filterState, setFilterState } = useFilterState({
    defaultState: {
      limit: 25
    }
  });

  const [arrangementsResponse, setArrangementsResponse] = useState<FilteredResponse<Arrangement> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAudio, setExpandedAudio] = useState<Set<number>>(new Set());

  const toggleAudio = useCallback((id: number) => {
    setExpandedAudio(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }, []);

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

  const formatSeconds = (total?: number) => {
    if (!total || total < 0) return '—';
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
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

      {/* Arrangements Table */}
      {arrangementsResponse && (
        <>
          <div className="hidden sm:block">
            <div className="rounded-md border mb-8 bg-card text-card-foreground shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[25%]">Title</TableHead>
                    <TableHead className="w-[20%]">Show</TableHead>
                    <TableHead className="w-[15%]">Composer</TableHead>
                    <TableHead className="w-[10%]">Duration</TableHead>
                    <TableHead className="w-[20%]">Audio</TableHead>
                    <TableHead className="w-[10%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {arrangementsResponse.data.map((arrangement) => {
                    const title = arrangement.title || 'Arrangement';
                    const composer = arrangement.composer;
                    const duration = (arrangement.durationSeconds ?? arrangement.duration_seconds) as number | undefined;
                    const files = arrangement.files || [];
                    const audio = files.find(f => f.fileType === 'audio');
                    const sampleScore = (arrangement.sampleScoreUrl ?? (arrangement as any).sample_score_url) as string | undefined;

                    const associatedShow = arrangement.showArrangements?.[0]?.show;

                    return (
                      <TableRow key={arrangement.id} className="group">
                        <TableCell className="font-medium">
                          <Link 
                            href={`/arrangements/${arrangement.id}`}
                            className="text-brand-midnight hover:underline font-primary text-lg"
                          >
                            {title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {associatedShow ? (
                            <Link 
                              href={`/shows/${associatedShow.slug}`}
                              className="text-muted-foreground hover:text-primary hover:underline"
                            >
                              {associatedShow.title}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground text-sm italic">Independent</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {composer || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-muted-foreground">
                            {formatSeconds(duration)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {audio ? (
                            <div className="flex items-center gap-2">
                              <audio 
                                controls 
                                className="h-8 w-full max-w-[200px]" 
                                preload="none"
                                src={audio.url}
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No audio</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {sampleScore && (
                              <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                                <Link href={sampleScore} target="_blank" rel="noopener noreferrer" title="Sample Score">
                                  <FileText className="w-4 h-4" />
                                  <span className="sr-only">Sample Score</span>
                                </Link>
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                              <Link href={`/arrangements/${arrangement.id}`} title="View Details">
                                <ExternalLink className="w-4 h-4" />
                                <span className="sr-only">View Details</span>
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="sm:hidden space-y-2 mb-8">
            {arrangementsResponse.data.map((arrangement) => {
              const title = arrangement.title || 'Arrangement';
              const composer = arrangement.composer;
              const duration = (arrangement.durationSeconds ?? arrangement.duration_seconds) as number | undefined;
              const files = arrangement.files || [];
              const audio = files.find(f => f.fileType === 'audio');
              const sampleScore = (arrangement.sampleScoreUrl ?? (arrangement as any).sample_score_url) as string | undefined;
              const associatedShow = arrangement.showArrangements?.[0]?.show;
              const audioOpen = expandedAudio.has(arrangement.id);

              return (
                <div key={arrangement.id} className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
                  {/* Main row */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Listen button */}
                    {audio ? (
                      <button
                        onClick={() => toggleAudio(arrangement.id)}
                        className="shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                        aria-label={audioOpen ? 'Hide audio' : 'Play audio'}
                      >
                        {audioOpen ? <ChevronDown className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>
                    ) : (
                      <div className="shrink-0 w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                        <Music className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}

                    {/* Title + show + meta */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/arrangements/${arrangement.id}`}
                        className="font-semibold text-sm text-brand-midnight hover:underline line-clamp-1"
                      >
                        {title}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        {associatedShow ? (
                          <Link href={`/shows/${associatedShow.slug}`} className="hover:text-primary hover:underline truncate">
                            {associatedShow.title}
                          </Link>
                        ) : (
                          <span className="italic">Independent</span>
                        )}
                        {composer && <><span>·</span><span className="truncate">{composer}</span></>}
                        {duration && <><span>·</span><span className="font-mono shrink-0">{formatSeconds(duration)}</span></>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {sampleScore && (
                        <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                          <Link href={sampleScore} target="_blank" rel="noopener noreferrer" title="Sample Score">
                            <FileText className="w-4 h-4" />
                            <span className="sr-only">Sample Score</span>
                          </Link>
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                        <Link href={`/arrangements/${arrangement.id}`} title="View Details">
                          <ExternalLink className="w-4 h-4" />
                          <span className="sr-only">View Details</span>
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Expandable audio player */}
                  {audio && audioOpen && (
                    <div className="px-4 pb-3 border-t pt-3">
                      <audio controls className="w-full h-8" preload="none" src={audio.url} autoPlay />
                    </div>
                  )}
                </div>
              );
            })}
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
