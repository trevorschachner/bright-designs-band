import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Users } from "lucide-react";
import { Show } from "@/lib/types/shows";

interface ShowListViewProps {
  item: Show;
  isLoading?: boolean;
}

export function ShowListView({ item: show, isLoading }: ShowListViewProps) {
  if (isLoading) {
    return <ShowListViewSkeleton />;
  }

  const displayDifficulty = (() => {
    const value = String(show.difficulty || '').toLowerCase();
    if (value === '1_2') return 'Beginner';
    if (value === '3_4') return 'Intermediate';
    if (value === '5_plus' || value === '5+') { return 'Advanced'; }
    if (!value) return 'Not specified';
    return show.difficulty as unknown as string;
  })();

  return (
    <Link href={`/shows/${(show as any).slug ?? show.id}`} className="block">
      <Card className="frame-card group overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
        <div className="flex flex-col sm:flex-row">
          {/* Thumbnail */}
          <div className="relative w-full sm:w-48 h-40 sm:h-auto flex-shrink-0 bg-accent-gradient overflow-hidden">
            <img
              src={show.thumbnailUrl || "/placeholder.svg"}
              alt={show.title || 'Show thumbnail'}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Button
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-background/90 text-foreground hover:bg-background hover-lift"
              size="sm"
            >
              <Play className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="text-xl font-bold transition-colors font-primary mb-1">
                  {show.title}
                </h3>
                <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {show.year}
                  </Badge>
                  <span className="flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    {displayDifficulty}
                  </span>
                  <span>•</span>
                  <span>{show.duration || 'TBD'}</span>
                  {show.arrangements && show.arrangements.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{show.arrangements.length} {show.arrangements.length === 1 ? 'arrangement' : 'arrangements'}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {show.description}
            </p>

            {/* Details (no pricing shown) */}
            <div className="mb-4" />

            {/* Tags */}
            {show.showsToTags && show.showsToTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {show.showsToTags.slice(0, 5).map((st: { tag: { id: number; name: string } }) => (
                  <Badge key={st.tag.id} variant="secondary" className="text-xs">
                    {st.tag.name}
                  </Badge>
                ))}
                {show.showsToTags.length > 5 && (
                  <Badge variant="secondary" className="text-xs">
                    +{show.showsToTags.length - 5} more
                  </Badge>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </Card>
    </Link>
  );
}

export function ShowListViewSkeleton() {
  return (
    <Card className="frame-card overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <div className="w-full sm:w-64 h-48 sm:h-auto">
          <Skeleton className="w-full h-full" />
        </div>
        <div className="flex-1 p-6">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <Skeleton className="h-7 w-3/4 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-4" />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    </Card>
  );
}

