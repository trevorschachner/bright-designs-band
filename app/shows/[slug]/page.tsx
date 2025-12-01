import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import Image from 'next/image'
import { CheckAvailabilityModal } from '@/components/forms/check-availability-modal'
import { getShowWithTagsBySlug, getShowWithArrangementsAndFiles, getPublicFilesByShowId } from '@/lib/database/queries'
import { WhatIsIncluded } from '@/components/features/what-is-included'
import type { Metadata } from 'next'
import { generateMetadata as buildMetadata } from '@/lib/seo/metadata'
import { JsonLd } from '@/components/features/seo/JsonLd'
import { createCreativeWorkSchema } from '@/lib/seo/structured-data'
import { notFound } from 'next/navigation'
import { db } from '@/lib/database'
import { shows } from '@/lib/database/schema'
import { eq } from 'drizzle-orm'
import { Suspense } from 'react'

interface ShowWithTagsResult {
  show: any
  showsToTags: Array<{ tag: any }>
}

async function getShowByIdentifier(identifier: string): Promise<ShowWithTagsResult | null> {
  const slugResult = await getShowWithTagsBySlug(identifier)
  if (slugResult) {
    return slugResult
  }

  if (!/^\d+$/.test(identifier)) {
    return null
  }

  const numericId = parseInt(identifier, 10)
  const show = await db.query.shows.findFirst({
    where: eq(shows.id, numericId),
    with: {
      showsToTags: {
        with: {
          tag: true,
        },
      },
    },
  })

  if (!show) {
    return null
  }

    const { showsToTags: tagRelations = [], ...rest } = show as any
    const formattedTags = Array.isArray(tagRelations)
      ? tagRelations
          .map((relation: any) => ({
            tag: relation?.tag ?? null,
          }))
          .filter((relation) => relation.tag)
      : []

    return {
      show: rest,
      showsToTags: formattedTags,
    }
  }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  try {
    // Optimized: Use the same helper function, React 18+ will deduplicate this request
    const showResult = await getShowByIdentifier(slug)
    const showRow = showResult?.show
    const tags = showResult?.showsToTags || []

    if (!showRow) {
      return buildMetadata({
        title: 'Show not found | Bright Designs',
        description: 'The requested show could not be found.',
        noindex: true,
      })
    }

    const envUrl = process.env.NEXT_PUBLIC_SITE_URL
    const baseUrl = (envUrl && envUrl !== '****') ? envUrl : 'https://www.brightdesigns.band'
    const canonicalSlug = showRow.slug || slug
    
    // Generate keywords from tags
    const tagKeywords = tags.map((t: any) => t.tag.name)
    const defaultKeywords = [
      "marching band show", 
      "competitive marching band", 
      "custom drill design", 
      "marching band arrangements",
      showRow.title
    ]
    
    return buildMetadata({
      title: `${showRow.title} | Bright Designs`,
      description: showRow.description ?? 'Award-winning marching band show from Bright Designs.',
      // Explicitly prioritize graphic/thumb if available, otherwise let opengraph-image.tsx handle it (by passing undefined)
      ogImage: showRow.graphicUrl ?? showRow.thumbnailUrl ?? undefined,
      canonical: `${baseUrl}/shows/${canonicalSlug}`,
      keywords: [...defaultKeywords, ...tagKeywords]
    })
  } catch (error) {
    console.error('Failed to generate metadata for show slug:', slug, error)
    return buildMetadata({
      title: 'Show not found | Bright Designs',
      description: 'The requested show could not be found.',
      noindex: true,
    })
  }
}

export default async function ShowDetailBySlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const showResult = await getShowByIdentifier(slug)

  if (!showResult) {
    notFound()
  }

  const { show: showRow, showsToTags } = showResult

  if (!showRow?.id) {
    notFound()
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
    thumbnailUrl: showRow.thumbnailUrl ?? null,
    graphicUrl: showRow.graphicUrl ?? null,
    createdAt: showRow.createdAt instanceof Date ? showRow.createdAt.toISOString() : (showRow as any).createdAt,
  }

  const displayDifficulty = (() => {
    const value = String(show.difficulty || '').toLowerCase()
    if (value === '1_2') return 'Beginner'
    if (value === '3_4') return 'Intermediate'
    if (value === '5_plus' || value === '5+') { return 'Advanced' }
    return String(show.difficulty || '')
  })()

  // Optimized: Fetch all arrangements with their files in a single query
  // This eliminates N+1 queries - previously was 1 + N queries (N = number of arrangements)
  // Now it's just 1 query total
  const arrangements = await getShowWithArrangementsAndFiles(showId)

  // Fetch show image files as fallback if graphicUrl/thumbnailUrl are not set
  const showFiles = await getPublicFilesByShowId(showId)
  const showImageFile = Array.isArray(showFiles) 
    ? showFiles.find((f: any) => f.fileType === 'image' && f.isPublic) 
    : null

  // Determine display image: graphicUrl > thumbnailUrl > show image file > null
  const displayImageUrl = show.graphicUrl || show.thumbnailUrl || showImageFile?.url || null

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
            {displayImageUrl ? (
              <Image
                src={displayImageUrl}
                alt={show.title}
                fill
                className="object-cover rounded-lg"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted/30">
                <Image 
                  src="/placeholder-logo.png" 
                  alt="Bright Designs Logo" 
                  width={180} 
                  height={180}
                  className="opacity-20 grayscale"
                />
              </div>
            )}
          </div>

          {/* Right side - Content */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="outline" className="text-sm">{show.year}</Badge>
              <Badge variant="secondary" className="text-sm">{displayDifficulty}</Badge>
            </div>

            <h1 className="text-4xl font-heading font-bold mb-4 text-foreground">{show.title}</h1>
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
              <CheckAvailabilityModal showTitle={show.title} />
            </div>
          </div>
        </div>

        {/* What's Included & Listen to Full Show - 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* What's Included */}
          <div>
            <WhatIsIncluded />
          </div>

          {/* Master Audio Player - Compact */}
          {arrangements.filter((a: any) => a.audioUrl).length > 0 && (
            <div id="master-player">
              <AudioPlayerComponent
                playerId="master-player"
                className="border-primary/20 shadow-sm"
                tracks={arrangements
                  .filter((a: any) => a.audioUrl)
                  .map((arrangement: any, index: number) => {
                    const parts = [];
                    if (arrangement.arranger) parts.push(`${arrangement.arranger} (Wind)`);
                    if (arrangement.percussionArranger) parts.push(`${arrangement.percussionArranger} (Percussion)`);
                    
                    const description = parts.length > 0 
                      ? `Arranged by ${parts.join(', ')}`
                      : arrangement.description || undefined;

                    return {
                      id: arrangement.id.toString(),
                      title: arrangement.title || `Movement ${index + 1}`,
                      description: description,
                      url: arrangement.audioUrl,
                    };
                  })}
                title="Listen to Full Show"
                compact
                showNavigation={true}
              />
            </div>
          )}
        </div>

        {/* Show Arrangements Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-heading font-bold text-foreground">Show Arrangements</h2>
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
                <CardContent className="p-4">
                  {/* Header Row */}
                  <div className="flex items-start gap-3 mb-3">
                    {/* Order Number */}
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary font-bold text-base">
                      {index + 1}
                    </div>
                    
                    {/* Title and Scene */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <h3 className="text-lg font-heading font-bold text-foreground group-hover:text-primary transition-colors">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
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
                    <p className="text-muted-foreground leading-relaxed mb-3 ml-12 text-sm">
                      {arrangement.description}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 ml-12">
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
      </div>

      {/* Structured Data */}
      <JsonLd data={creativeWorkSchema} />
    </div>
  )
}


