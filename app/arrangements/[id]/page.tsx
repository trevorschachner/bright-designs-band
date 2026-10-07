import { ArrowLeft, Play, Download, Clock, Music2, FileText, Users, Music } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import Link from "next/link"
import { AudioPlayerComponent, audioPlayerStyles } from "@/components/features/audio-player"
import { getArrangementDetail } from "@/lib/services/arrangements"
import { SourcePieces } from '@/components/features/source-pieces'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { generateMetadata as buildMetadata } from '@/lib/seo/metadata'
import { JsonLd } from '@/components/features/seo/JsonLd'
import { ResaleCallout } from '@/components/features/resale-callout'
import { createMusicCompositionSchema, createBreadcrumbSchema } from '@/lib/seo/structured-data'

// Rendered on first request, then cached and revalidated hourly; writes
// expire it through invalidateArrangement (lib/services/invalidate.ts).
export const revalidate = 3600

/** No prebuild: an empty list opts the route into on-demand ISR. */
export function generateStaticParams() {
  return []
}

/** One lookup per request, shared by generateMetadata and the page. */
const getArrangement = cache((id: string) =>
  /^\d+$/.test(id) ? getArrangementDetail(Number(id)) : Promise.resolve(null)
)

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const arr = await getArrangement(id)

  if (!arr) {
    return buildMetadata({
      title: 'Arrangement Not Found',
      noindex: true
    })
  }

  // A null composer is left out rather than printed as "null".
  const byComposer = arr.composer ? ` by ${arr.composer}` : ''
  return buildMetadata({
    title: arr.composer
      ? `${arr.title} - ${arr.composer} | Bright Designs Arrangements`
      : `${arr.title} | Bright Designs Arrangements`,
    description: arr.description || `Custom arrangement of ${arr.title}${byComposer}. Professional marching band music design.`,
    // OG Image is automatically handled by opengraph-image.tsx
  })
}

export default async function ArrangementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const arr = await getArrangement(id);

  if (!arr) {
    notFound();
  }

  const parentShow = arr.show;
  const files = arr.files;

  // Structured data. The breadcrumb mirrors the visible one: through the
  // parent show when there is one, else through /arrangements.
  const arrangementPath = `/arrangements/${arr.id}`
  const breadcrumbSchema = createBreadcrumbSchema(
    parentShow
      ? [
          { name: 'Home', url: '/' },
          { name: 'Shows', url: '/shows' },
          { name: parentShow.title, url: `/shows/${parentShow.slug}` },
          { name: arr.title, url: arrangementPath },
        ]
      : [
          { name: 'Home', url: '/' },
          { name: 'Arrangements', url: '/arrangements' },
          { name: arr.title, url: arrangementPath },
        ]
  )

  const compositionSchema = createMusicCompositionSchema({
    name: arr.title,
    description: arr.description,
    url: arrangementPath,
    composer: arr.composer,
    year: arr.year,
    pieces: arr.pieces,
    partOf: parentShow ? { name: parentShow.title, url: `/shows/${parentShow.slug}` } : null,
  })

  const audio = files.find((f) => f.fileType === 'audio');
  const arrangementImage = files.find((f) => f.fileType === 'image');

  // Arrangement image, then the show's graphic, thumbnail, first image file.
  const displayImage = arrangementImage?.url || parentShow?.graphicUrl || parentShow?.thumbnailUrl || parentShow?.imageUrl || null;

  const formatSeconds = (total?: number | null) => {
    if (!total || total < 0) return '—'
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const displayGrade = (() => {
    const value = String(arr.grade || '').toLowerCase();
    if (value === '1_2') return 'Grade 1-2';
    if (value === '3_4') return 'Grade 3-4';
    if (value === '5_plus' || value === '5+') return 'Grade 5+';
    return null;
  })();

  const displayEnsembleSize = (() => {
    const value = String(arr.ensembleSize || '').toLowerCase();
    if (value === 'small') return 'Small Ensemble';
    if (value === 'medium') return 'Medium Ensemble';
    if (value === 'large') return 'Large Ensemble';
    return null;
  })();

  return (
    <div className="min-h-screen bg-background">
      <style dangerouslySetInnerHTML={{ __html: audioPlayerStyles }} />
      <JsonLd data={[breadcrumbSchema, compositionSchema]} />

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
            {parentShow ? (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/shows">Shows</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={`/shows/${parentShow.slug}`}>{parentShow.title}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            ) : (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/arrangements">Arrangements</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}
            <BreadcrumbItem>
              <BreadcrumbPage>{arr.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Arrangement Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left side - Image */}
          <div className="relative bg-muted rounded-lg shadow-lg overflow-hidden aspect-video" id="listen">
            {displayImage ? (
              <Image
                src={displayImage}
                alt={arr.title || 'Arrangement image'}
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="relative w-full h-full overflow-hidden bg-muted/30">
                {parentShow?.graphicUrl && (
                  <Image
                    src={parentShow.graphicUrl}
                    alt={parentShow.title || 'Show artwork'}
                    fill
                    className="object-cover opacity-30 blur-sm"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/75 to-background/90" />
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-8">
                  {parentShow?.title && (
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">
                      {parentShow.title}
                    </p>
                  )}
                  <p className="text-3xl font-heading font-bold text-foreground">{arr.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Arrangement preview</p>
                </div>
              </div>
            )}
          </div>

          {/* Right side - Content */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              {arr.scene && (
                <Badge variant="outline" className="text-sm">{String(arr.scene)}</Badge>
              )}
              {displayGrade && (
                <Badge variant="secondary" className="text-sm">{displayGrade}</Badge>
              )}
              {arr.year && (
                <Badge variant="outline" className="text-sm">{arr.year}</Badge>
              )}
            </div>

            <h1 className="text-4xl font-heading font-bold mb-4 text-foreground">{arr.title}</h1>
            
            {parentShow && (
              <p className="text-lg text-primary mb-4">
                From:{" "}
                <Link href={`/shows/${parentShow.slug}`} className="hover:underline">
                  {parentShow.title}
                </Link>
              </p>
            )}

            {arr.description && (
              <p className="text-lg text-muted-foreground mb-6">{arr.description}</p>
            )}

            <SourcePieces
              part={arr}
              pieces={arr.pieces}
              className="mb-6"
            />

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {arr.composer && (
                <div className="flex items-center">
                  <Music2 className="w-4 h-4 text-muted-foreground mr-2" />
                  <span className="text-sm"><span className="font-medium">Composer:</span> {arr.composer}</span>
                </div>
              )}
              {arr.arranger && (
                <div className="flex items-center">
                  <Music className="w-4 h-4 text-muted-foreground mr-2" />
                  <span className="text-sm"><span className="font-medium">Music Arranger:</span> {arr.arranger}</span>
                </div>
              )}
              {arr.percussionArranger && (
                <div className="flex items-center">
                  <Music className="w-4 h-4 text-muted-foreground mr-2" />
                  <span className="text-sm"><span className="font-medium">Percussion Arranger:</span> {arr.percussionArranger}</span>
                </div>
              )}
              {arr.durationSeconds && (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-muted-foreground mr-2" />
                  <span className="text-sm"><span className="font-medium">Duration:</span> {formatSeconds(arr.durationSeconds)}</span>
                </div>
              )}
              {displayEnsembleSize && (
                <div className="flex items-center">
                  <Users className="w-4 h-4 text-muted-foreground mr-2" />
                  <span className="text-sm"><span className="font-medium">Ensemble Size:</span> {displayEnsembleSize}</span>
                </div>
              )}
              {arr.commissioned && (
                <div className="flex items-center">
                  <FileText className="w-4 h-4 text-muted-foreground mr-2" />
                  <span className="text-sm"><span className="font-medium">Commissioned:</span> {arr.commissioned}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {audio?.url && (
                <Button className="btn-primary w-full" asChild>
                  <Link href="#audio-player">
                    <Play className="w-4 h-4 mr-2" />
                    Listen Now
                  </Link>
                </Button>
              )}
              {arr.sampleScoreUrl && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href={arr.sampleScoreUrl} target="_blank" rel="noopener noreferrer">
                    <FileText className="w-4 h-4 mr-2" />
                    Download Sample Materials
                  </Link>
                </Button>
              )}
              {parentShow && (
                <Button variant="ghost" className="w-full" asChild>
                  <Link href={`/shows/${parentShow.slug}`}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    View Full Show
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Audio Player Section */}
        {audio?.url ? (
          <div id="audio-player" className="mb-12 scroll-mt-8">
            <h2 className="text-2xl font-heading font-bold mb-4 text-foreground">Listen to Arrangement</h2>
            <AudioPlayerComponent  
              tracks={[{ 
                id: String(arr.id),
                title: arr.title || 'Full Arrangement', 
                duration: arr.durationSeconds ? formatSeconds(arr.durationSeconds) : '', 
                description: arr.description || '', 
                type: 'Full Track', 
                url: audio.url,
                imageUrl: parentShow?.graphicUrl || parentShow?.thumbnailUrl || undefined
              }]}
              title="Arrangement Audio Preview"
              className="bg-card/80 backdrop-blur-sm"
              allowDownload={false}
            />
          </div>
        ) : (
          <div className="mb-12">
            <h2 className="text-2xl font-heading font-bold mb-4 text-foreground">Audio Sample</h2>
            <Card className="bg-muted/50">
              <CardContent className="p-6 text-center">
                <Music2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No audio sample available for this arrangement.</p>
              </CardContent>
            </Card>
          </div>
        )}

        <ResaleCallout kind="arrangement" title={arr.title || 'this arrangement'} className="mb-12" />

        {/* Additional Files Section */}
        {files && files.length > 1 && (
          <div className="mb-12">
            <h2 className="text-2xl font-heading font-bold mb-4 text-foreground">Related Files</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.filter((f) => f.fileType !== 'audio').map((file) => (
                <Card key={file.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-primary" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{file.originalName || file.fileName}</div>
                        <div className="text-xs text-muted-foreground capitalize">{file.fileType}</div>
                      </div>
                      {file.url && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={file.url} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
