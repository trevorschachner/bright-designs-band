import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Users, Music, DollarSign } from "lucide-react";
import { Show } from "@/lib/types/shows";

interface ShowListViewProps {
  item: Show;
  isLoading?: boolean;
}

export function ShowListView({ item: show, isLoading }: ShowListViewProps) {
  if (isLoading) {
    return <ShowListViewSkeleton />;
  }

  return (
    <Card className="frame-card group overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Thumbnail */}
        <div className="relative w-full sm:w-64 h-48 sm:h-auto flex-shrink-0 bg-accent-gradient overflow-hidden">
          <img
            src={show.thumbnailUrl || "/placeholder.svg"}
            alt={show.title}
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
        <div className="flex-1 p-6">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="text-2xl font-bold transition-colors font-primary mb-1">
                  {show.title}
                </h3>
                <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {show.year}
                  </Badge>
                  <span className="flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    {show.difficulty || 'Not specified'}
                  </span>
                  <span>•</span>
                  <span>{show.duration || 'TBD'}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {show.description}
            </p>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              {show.composer && (
                <div className="flex items-start gap-2">
                  <Music className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-muted-foreground">Composer</div>
                    <div className="font-medium">{show.composer}</div>
                  </div>
                </div>
              )}
              {show.songTitle && (
                <div className="flex items-start gap-2">
                  <Music className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-muted-foreground">Song Title</div>
                    <div className="font-medium">{show.songTitle}</div>
                  </div>
                </div>
              )}
              {show.price !== undefined && (
                <div className="flex items-start gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-muted-foreground">Price</div>
                    <div className="font-medium">${show.price}</div>
                  </div>
                </div>
              )}
              {show.arrangements && show.arrangements.length > 0 && (
                <div className="flex items-start gap-2">
                  <Music className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-muted-foreground">Arrangements</div>
                    <div className="font-medium">
                      {show.arrangements.length} available
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            {show.showsToTags && show.showsToTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
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

            {/* Actions */}
            <div className="mt-auto pt-4">
              <Button className="btn-primary w-full sm:w-auto" asChild>
                <Link href={`/shows/${show.id}`}>View Details</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
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

