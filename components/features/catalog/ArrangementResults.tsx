'use client';

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Music, FileText, ExternalLink, Play, ChevronDown, MessageSquare } from "lucide-react";
import { arrangementContactHref } from "@/lib/contact-link";
import type { ArrangementListItem } from "@/lib/services/arrangements";

const formatSeconds = (total?: number | null) => {
  if (!total || total < 0) return '—';
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

/**
 * One server-rendered page of arrangements: the table (sm and up) and the
 * compact rows with an expandable player (below sm). The only client state is
 * which rows have their player open.
 */
export function ArrangementResults({ items }: { items: ArrangementListItem[] }) {
  const [expandedAudio, setExpandedAudio] = useState<Set<number>>(new Set());

  const toggleAudio = useCallback((id: number) => {
    setExpandedAudio(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }, []);

  return (
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
            {items.map((arrangement) => {
              const title = arrangement.title || 'Arrangement';
              const composer = arrangement.composer;
              const duration = arrangement.durationSeconds;
              const files = arrangement.files || [];
              const audio = files.find(f => f.fileType === 'audio');
              const sampleScore = arrangement.sampleScoreUrl;

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
                        <Link href={arrangementContactHref(title)} title="Ask about this arrangement">
                          <MessageSquare className="w-4 h-4" />
                          <span className="sr-only">Ask about this arrangement</span>
                        </Link>
                      </Button>
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
      {items.map((arrangement) => {
        const title = arrangement.title || 'Arrangement';
        const composer = arrangement.composer;
        const duration = arrangement.durationSeconds;
        const files = arrangement.files || [];
        const audio = files.find(f => f.fileType === 'audio');
        const sampleScore = arrangement.sampleScoreUrl;
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
                  <Link href={arrangementContactHref(title)} title="Ask about this arrangement">
                    <MessageSquare className="w-4 h-4" />
                    <span className="sr-only">Ask about this arrangement</span>
                  </Link>
                </Button>
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
    </>
  );
}
