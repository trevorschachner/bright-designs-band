import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Users } from "lucide-react";
import { Show } from "@/lib/types/shows";

interface ShowCardProps {
  item: Show;
  isLoading?: boolean;
}

export function ShowCard({ item: show, isLoading }: ShowCardProps) {
  if (isLoading) {
    return <ShowCardSkeleton />;
  }

  return (
    <Card className="frame-card group">
      <div className="relative overflow-hidden rounded-t-lg bg-accent-gradient">
        <img
          src={show.thumbnailUrl || "/placeholder.svg"}
          alt={show.title}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Button
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 text-gray-900 hover:bg-white hover-lift"
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
        <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
          <span className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            {show.difficulty || 'Not specified'}
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
          <div className="text-xs text-gray-500 mb-4">
            {show.arrangements.length} arrangement{show.arrangements.length !== 1 ? 's' : ''} available
          </div>
        )}
        <Button className="btn-primary w-full" asChild>
          <Link href={`/shows/${show.id}`}>View Details</Link>
        </Button>
      </CardContent>
    </Card>
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
