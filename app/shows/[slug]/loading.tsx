import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function ShowLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb Skeleton */}
        <div className="mb-6 flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Show Header Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Skeleton */}
          <Skeleton className="aspect-video rounded-lg" />
          
          {/* Content Skeleton */}
          <div className="space-y-4">
            <div className="flex gap-3">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-2/3" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-18" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>

        {/* Arrangements Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-24" />
          </div>
          
          {[1, 2, 3].map((i) => (
            <Card key={i} className="frame-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <div className="flex gap-3">
                      <Skeleton className="h-9 w-32" />
                      <Skeleton className="h-9 w-28" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

