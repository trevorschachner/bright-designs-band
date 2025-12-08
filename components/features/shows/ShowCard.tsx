'use client';
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Users } from "lucide-react";
import { Show } from "@/lib/types/shows";
import { useRouter } from "next/navigation";

// Define a flexible type that covers both Show (full) and ShowSummary (partial)
export interface ShowCardItem {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  year: number | null;
  difficulty: string | null;
  duration: string | null;
  thumbnailUrl: string | null;
  graphicUrl: string | null;
  showsToTags?: { tag: { id: number; name: string } }[];
  arrangements?: { id: number; title: string | null; scene?: string | null }[];
  [key: string]: any; // Allow other properties
}

interface ShowCardProps {
  item: ShowCardItem;
  isLoading?: boolean;
}

export function ShowCard({ item: show, isLoading }: ShowCardProps) {
  const router = useRouter();
  
  if (isLoading || !show) {
    return <ShowCardSkeleton />;
  }
  const href = `/shows/${(show as any).slug ?? show.id}`;

  const displayDifficulty = (() => {
    const value = String(show.difficulty || '').toLowerCase();
    if (value === '1_2') return 'Beginner';
    if (value === '3_4') return 'Intermediate';
    if (value === '5_plus' || value === '5+'){ return 'Advanced'; }
    if (!value) return 'Not specified';
    return show.difficulty as unknown as string;
  })();

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(href);
        }
      }}
      className="block"
    >
      <Card className="frame-card group cursor-pointer hover:shadow-lg transition-shadow">
        <div className="relative overflow-hidden rounded-t-lg bg-accent-gradient aspect-video">
          <Image
            src={show.graphicUrl || show.thumbnailUrl || "/placeholder.svg"}
            alt={show.title || 'Show thumbnail'}
            width={400}
            height={225}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Button
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-background/90 text-foreground hover:bg-background hover-lift"
          >
            <Play className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </div>
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-xl transition-colors font-primary">
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
        <div className="flex justify-between items-center mb-4 text-sm text-muted-foreground">
          <span className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            {displayDifficulty}
          </span>
          <span>{show.duration || 'TBD'}</span>
        </div>
        {show.showsToTags && show.showsToTags.length > 0 && (
          <ul className="list-better mb-4">
            {show.showsToTags.slice(0, 3).map((st: { tag: { id: number; name: string } }) => (
              <li key={st.tag.id}>
                <span className="sr-only">Tag</span>
                <span className="text-xs">{st.tag.name}</span>
              </li>
            ))}
            {show.showsToTags.length > 3 && (
              <li>
                <span className="sr-only">More</span>
                <span className="text-xs">+{show.showsToTags.length - 3} more</span>
              </li>
            )}
          </ul>
        )}
        {show.arrangements && show.arrangements.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-muted-foreground mb-2">
              {show.arrangements.length} {show.arrangements.length !== 1 ? 'arrangements' : 'arrangement'}:
            </div>
            <ul className="space-y-1">
              {show.arrangements.slice(0, 3).map((a: any) => (
                <li key={a.id} className="text-sm">
                  <Link 
                    href={`/arrangements/${a.id}`} 
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {a.scene ? <Badge variant="outline" className="mr-2 text-[10px]">{String(a.scene)}</Badge> : null}
                    <span>{a.title || 'Untitled'}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {show.arrangements.length > 3 && (
              <div className="text-[12px] text-muted-foreground mt-1">
                +{show.arrangements.length - 3} more
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}

export function ShowCardSkeleton() {
  return (
    <Card className="frame-card">
      <div className="relative overflow-hidden rounded-t-lg">
        <Skeleton className="w-full h-48" />
      </div>
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-5 w-12" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-2 mb-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-3 w-24 mb-4" />
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}
