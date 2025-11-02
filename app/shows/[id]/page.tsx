import { createClient } from '@/lib/utils/supabase/server'
import { eq } from 'drizzle-orm'
import { shows } from '@/lib/database/schema'
import { db } from '@/lib/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Clock, Users, Download, Play, Pause, Calendar, Music, Music2, Target, ArrowLeft, FileText } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { CheckAvailabilityModal } from '@/components/forms/check-availability-modal'
import { getArrangementsByShowId, getFilesByArrangementId } from '@/lib/database/queries'
import { YouTubePlayer } from '@/components/features/youtube-player'
import { WhatIsIncluded } from '@/components/features/what-is-included'
// TODO: Uncomment when Show Plan is production ready
// import { AddToPlanButton } from '@/components/features/shows/AddToPlanButton'

export default async function ShowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const showId = parseInt(id, 10);
  const show = await db.query.shows.findFirst({
    where: eq(shows.id, showId),
    with: {
      showsToTags: {
        with: {
          tag: true,
        },
      },
      // showArrangements available via helper query below
    },
  });

  if (!show) {
    return <div>Show not found</div>;
  }

  const displayDifficulty = (() => {
    const value = String(show.difficulty || '').toLowerCase();
    if (value === '1_2') return 'Beginner';
    if (value === '3_4') return 'Intermediate';
    if (value === '5_plus' || value === '5+') { return 'Advanced'; }
    return String(show.difficulty || '');
  })();

  // Load ordered arrangements and attach preview audio where available
  const rawArrangements = await getArrangementsByShowId(showId)
  const arrangements = await Promise.all(
    rawArrangements.map(async (a: any) => {
      const files = await getFilesByArrangementId(a.id)
      const audio = Array.isArray(files) ? files.find((f: any) => f.fileType === 'audio' && f.isPublic) : undefined
      return {
        id: a.id,
        title: a.title,
        description: a.description || '',
        composer: a.composer || null,
        durationSeconds: a.durationSeconds || null,
        orderIndex: a.orderIndex ?? 0,
        sampleScoreUrl: a.sampleScoreUrl || null,
        audioUrl: audio?.url || null,
      }
    })
  )

  const formatSeconds = (total?: number | null) => {
    if (!total || total < 0) return '—'
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Audio player styles are now included in globals.css */}
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/shows">Shows</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{show.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Show Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left side - Video or Image */}
          <div className="relative" id="listen">
            {show.videoUrl ? (
              <YouTubePlayer youtubeUrl={show.videoUrl} />
            ) : (
              <div className="w-full h-80 bg-muted rounded-lg shadow-lg flex items-center justify-center">
                <div className="text-muted-foreground">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Right side - Content */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="outline" className="text-sm">{show.year}</Badge>
              <Badge variant="secondary" className="text-sm">{displayDifficulty}</Badge>
            </div>

            <h1 className="text-4xl font-bold mb-4 text-foreground font-primary">{String(show.name || show.title || '')}</h1>
            <p className="text-lg text-muted-foreground mb-6">{show.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-muted-foreground mr-2" />
                <span className="text-sm">{show.duration}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 text-muted-foreground mr-2" />
                <span className="text-sm">{arrangements.length} Arrangements</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {show.showsToTags?.map((relation: any) => (
                <Badge key={relation.tag.id} variant="outline" className="text-xs">
                  {relation.tag.name}
                </Badge>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <Button className="btn-primary w-full" asChild>
                <Link href="#listen">
                  <Play className="w-4 h-4 mr-2" />
                  Listen Now
                </Link>
              </Button>
              <Button variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download Sample Materials
              </Button>
              <CheckAvailabilityModal showTitle={String(show.name || show.title || '')} />
            </div>
          </div>
        </div>

        {/* Show Arrangements Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-foreground font-primary">Show Arrangements</h2>
            <Badge variant="secondary" className="text-sm">
              {arrangements.length} Movements
            </Badge>
          </div>
          
          {arrangements.map((arrangement, index) => (
            <Card key={arrangement.id} className="frame-card overflow-hidden group hover:shadow-xl transition-all duration-300 border-l-4 border-l-bright-primary/50 hover:border-l-bright-primary">
              <CardContent className="p-0">
                {/* Header with gradient accent */}
                <div className="bg-gradient-to-r from-bright-primary/5 via-transparent to-transparent p-6 pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-bright-primary/10 text-bright-primary font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-foreground group-hover:text-bright-primary transition-colors">
                        {arrangement.title}
                      </h3>
                      <p className="text-muted-foreground flex items-center gap-2">
                        {arrangement.composer ? (
                          <>
                            <Music2 className="w-4 h-4" />
                            <span>Composer: {arrangement.composer}</span>
                          </>
                        ) : null}
                        <span className="ml-2 text-bright-primary">{formatSeconds(arrangement.durationSeconds)}</span>
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-3 leading-relaxed ml-[52px]">
                    {arrangement.description}
                  </p>
                </div>

                {/* Meta removed (instrumentation/tempo/key) per spec */}

                {/* Audio Player */}
                <div className="px-6 py-4 bg-card border-t" id={index === 0 ? 'listen' : undefined}>
                  <div className="flex items-center gap-3 mb-2">
                    <Play className="w-4 h-4 text-bright-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Audio Preview</span>
                  </div>
                  {arrangement.audioUrl ? (
                    <audio 
                      controls 
                      className="w-full h-10 rounded-lg"
                      preload="metadata"
                    >
                      <source src={arrangement.audioUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  ) : (
                    <div className="text-sm text-muted-foreground">No audio preview available.</div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="px-6 py-5 bg-muted/10 border-t">
                  <div className="flex flex-wrap gap-3">
                    {arrangement.sampleScoreUrl ? (
                      <Button variant="outline" size="default" asChild>
                        <Link href={arrangement.sampleScoreUrl} target="_blank" rel="noopener noreferrer">
                          <FileText className="w-4 h-4 mr-2" />
                          Sample Score
                        </Link>
                      </Button>
                    ) : null}
                    {/* TODO: Uncomment when Show Plan is production ready */}
                    {/* <AddToPlanButton id={arrangement.id} title={arrangement.title} type="arrangement" size="default" /> */}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* What's Included Section */}
        <div className="mt-12">
          <WhatIsIncluded />
        </div>
      </div>
    </div>
  )
}
