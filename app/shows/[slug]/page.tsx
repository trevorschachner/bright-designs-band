import { createClient } from '@/lib/utils/supabase/server'
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
import { Clock, Users, Download, Play, Calendar, Music, Music2, Target, ArrowLeft, FileText } from 'lucide-react'
import { AudioPlayerComponent } from '@/components/features/audio-player'
import Link from 'next/link'
import { CheckAvailabilityModal } from '@/components/forms/check-availability-modal'
import { getArrangementsByShowId, getFilesByArrangementId } from '@/lib/database/queries'
import { WhatIsIncluded } from '@/components/features/what-is-included'
import type { Metadata } from 'next'
import { generateMetadata as buildMetadata } from '@/lib/seo/metadata'
import { JsonLd } from '@/components/features/seo/JsonLd'
import { createCreativeWorkSchema } from '@/lib/seo/structured-data'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: showRow } = await supabase
    .from('shows')
    .select('id,slug,title,description,year,difficulty,duration,thumbnail_url,created_at')
    .eq('slug', slug)
    .single()

  if (!showRow) {
    return buildMetadata({
      title: 'Show not found | Bright Designs',
      description: 'The requested show could not be found.',
      noindex: true,
    })
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.brightdesigns.band'
  return buildMetadata({
    title: `${showRow.title} | Bright Designs`,
    description: showRow.description || 'Award-winning marching band show from Bright Designs.',
    ogImage: showRow.thumbnail_url || '/og-image.jpg',
    canonical: `${baseUrl}/shows/${showRow.slug}`,
  })
}

export default async function ShowDetailBySlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch show by slug
  const { data: showRow, error: showErr } = await supabase
    .from('shows')
    .select('id,slug,title,description,year,difficulty,duration,thumbnail_url,created_at')
    .eq('slug', slug)
    .single()

  if (showErr || !showRow) {
    throw new Error(`Failed to load show`)
  }

  const showId = showRow.id as number

  const show = {
    id: showRow.id,
    slug: showRow.slug as string,
    title: showRow.title as string,
    description: showRow.description as string | null,
    year: showRow.year as number | null,
    difficulty: showRow.difficulty as string | null,
    duration: showRow.duration as string | null,
    thumbnailUrl: (showRow as any).thumbnail_url || null,
    createdAt: showRow.created_at as string,
  }

  // Fetch tags
  const { data: tagRows } = await supabase
    .from('shows_to_tags')
    .select('tags(id,name)')
    .eq('show_id', showId)

  const showsToTags = Array.isArray(tagRows)
    ? tagRows.map((r: any) => ({ tag: r.tags })).filter((r: any) => r.tag)
    : []

  const displayDifficulty = (() => {
    const value = String(show.difficulty || '').toLowerCase()
    if (value === '1_2') return 'Beginner'
    if (value === '3_4') return 'Intermediate'
    if (value === '5_plus' || value === '5+') { return 'Advanced' }
    return String(show.difficulty || '')
  })()

  // Load ordered arrangements and attach preview audio where available
  const rawArrangements = await getArrangementsByShowId(showId)
  const arrangements = await Promise.all(
    (rawArrangements || []).map(async (a: any) => {
      const files = await getFilesByArrangementId(a.id)
      const audio = Array.isArray(files) ? files.find((f: any) => f.fileType === 'audio' && f.isPublic) : undefined
      return {
        id: a.id,
        title: a.title,
        scene: a.scene || null,
        description: a.description || '',
        composer: a.composer || null,
        percussionArranger: a.percussionArranger || null,
        grade: a.grade || null,
        year: a.year || null,
        ensembleSize: a.ensembleSize || null,
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

  const creativeWorkSchema = createCreativeWorkSchema({
    name: show.title,
    description: show.description || '',
    creator: 'Bright Designs',
    year: show.year ? String(show.year) : undefined,
    difficulty: displayDifficulty || undefined,
    duration: show.duration || undefined,
  })

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
          {/* Left side - Image */}
          <div className="relative bg-muted rounded-lg shadow-lg overflow-hidden aspect-video" id="listen">
            {show.thumbnailUrl ? (
              <div className="w-full h-full flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={show.thumbnailUrl}
                  alt={show.title}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
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

            <h1 className="text-4xl font-bold mb-4 text-foreground font-primary">{show.title}</h1>
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
              {showsToTags?.map((relation: any) => (
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
              <CheckAvailabilityModal showTitle={show.title} />
            </div>
          </div>
        </div>

        {/* Show Arrangements Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-foreground font-primary">Show Arrangements</h2>
            <Badge variant="secondary" className="text-sm font-medium">
              {arrangements.length} {arrangements.length === 1 ? 'Movement' : 'Movements'}
            </Badge>
          </div>
          
          {arrangements.map((arrangement, index) => {
            const displayGrade = (() => {
              const value = String(arrangement.grade || '').toLowerCase();
              if (value === '1_2') return 'Grade 1-2';
              if (value === '3_4') return 'Grade 3-4';
              if (value === '5_plus' || value === '5+') return 'Grade 5+';
              return null;
            })();

            const displayEnsembleSize = (() => {
              const value = String(arrangement.ensembleSize || '').toLowerCase();
              if (value === 'small') return 'Small Ensemble';
              if (value === 'medium') return 'Medium Ensemble';
              if (value === 'large') return 'Large Ensemble';
              return null;
            })();

            return (
              <Card 
                key={arrangement.id} 
                className="frame-card overflow-hidden group hover:shadow-lg transition-all duration-200 border border-border hover:border-primary/20"
                id={index === 0 ? 'listen' : undefined}
              >
                <CardContent className="p-6">
                  {/* Header Row */}
                  <div className="flex items-start gap-4 mb-4">
                    {/* Order Number */}
                    <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary font-bold text-lg">
                      {index + 1}
                    </div>
                    
                    {/* Title and Scene */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                          <Link href={`/arrangements/${arrangement.id}`} className="hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded">
                            {arrangement.title}
                          </Link>
                        </h3>
                        {arrangement.scene && (
                          <Badge variant="outline" className="text-xs font-medium shrink-0">
                            {String(arrangement.scene)}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Metadata Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground">
                        {arrangement.composer && (
                          <div className="flex items-center gap-2">
                            <Music2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span><span className="font-medium">Composer:</span> {arrangement.composer}</span>
                          </div>
                        )}
                        {arrangement.percussionArranger && (
                          <div className="flex items-center gap-2">
                            <Music className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span><span className="font-medium">Percussion:</span> {arrangement.percussionArranger}</span>
                          </div>
                        )}
                        {displayGrade && (
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span><span className="font-medium">Grade:</span> {displayGrade}</span>
                          </div>
                        )}
                        {arrangement.year && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span><span className="font-medium">Year:</span> {arrangement.year}</span>
                          </div>
                        )}
                        {displayEnsembleSize && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span><span className="font-medium">Ensemble:</span> {displayEnsembleSize}</span>
                          </div>
                        )}
                        {arrangement.durationSeconds && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span><span className="font-medium">Duration:</span> {formatSeconds(arrangement.durationSeconds)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {arrangement.description && (
                    <p className="text-muted-foreground leading-relaxed mb-4 ml-16">
                      {arrangement.description}
                    </p>
                  )}

                  {/* Audio Player */}
                  {arrangement.audioUrl && (
                    <div className="ml-16 mb-4">
                      <AudioPlayerComponent
                        tracks={[{
                          id: arrangement.id.toString(),
                          title: arrangement.title || 'Audio Preview',
                          description: arrangement.description || undefined,
                          url: arrangement.audioUrl
                        }]}
                        compact
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 ml-16">
                    {arrangement.sampleScoreUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={arrangement.sampleScoreUrl} target="_blank" rel="noopener noreferrer" className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                          <FileText className="w-4 h-4 mr-2" aria-hidden="true" />
                          Sample Score
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/arrangements/${arrangement.id}`} className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                        View Details
                        <ArrowLeft className="w-4 h-4 ml-2 rotate-180" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* What's Included Section */}
        <div className="mt-12">
          <WhatIsIncluded />
        </div>
      </div>

      {/* Structured Data */}
      <JsonLd data={creativeWorkSchema} />
    </div>
  )
}


