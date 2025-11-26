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
import { getFilesByArrangementId } from "@/lib/database/queries"
import { createClient } from '@/lib/utils/supabase/server'
import { Metadata } from 'next'
import { generateMetadata as buildMetadata } from '@/lib/seo/metadata'
import { JsonLd } from '@/components/features/seo/JsonLd'
import { createCreativeWorkSchema } from '@/lib/seo/structured-data'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: arr } = await supabase
    .from('arrangements')
    .select('title, description, composer')
    .eq('id', Number(id))
    .single()

  if (!arr) {
    return buildMetadata({
      title: 'Arrangement Not Found',
      noindex: true
    })
  }

  return buildMetadata({
    title: `${arr.title} - ${arr.composer} | Bright Designs Arrangements`,
    description: arr.description || `Custom arrangement of ${arr.title} by ${arr.composer}. Professional marching band music design.`,
    // OG Image is automatically handled by opengraph-image.tsx
  })
}

export default async function ArrangementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const arrangementId = Number(id);
  const supabase = await createClient();

  // Fetch arrangement with all fields
  const { data: arr, error: arrError } = await supabase
    .from('arrangements')
    .select('*')
    .eq('id', arrangementId)
    .single();

  if (arrError || !arr) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Arrangement not found</h1>
          <Button asChild>
            <Link href="/arrangements">Back to Arrangements</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Generate Structured Data
  const creativeWorkSchema = createCreativeWorkSchema({
    name: arr.title,
    description: arr.description || `Arrangement of ${arr.title}`,
    creator: arr.composer || 'Bright Designs',
    difficulty: arr.grade ? `Grade ${arr.grade}` : undefined,
    duration: arr.duration_seconds ? `${Math.floor(arr.duration_seconds / 60)}:${String(arr.duration_seconds % 60).padStart(2, '0')}` : undefined,
  })

  // Fetch show information if linked
  let parentShow: { id: number; title?: string | null; name?: string | null; thumbnailUrl?: string | null; graphicUrl?: string | null } | null = null;
  let showImageFiles: any[] = [];
  
  const { data: showArrData } = await supabase
    .from('show_arrangements')
    .select('show_id, order_index')
    .eq('arrangement_id', arrangementId)
    .limit(1)
    .single();

  if (showArrData?.show_id) {
    const { data: showData } = await supabase
      .from('shows')
      .select('id, title, name, thumbnail_url, graphic_url')
      .eq('id', showArrData.show_id)
      .single();
    
    if (showData) {
      parentShow = {
        id: showData.id,
        title: showData.title,
        name: showData.name,
        thumbnailUrl: showData.thumbnail_url,
        graphicUrl: showData.graphic_url,
      };
      
      // Fetch show image files as fallback
      const { data: showFiles } = await supabase
        .from('files')
        .select('url, file_type, is_public')
        .eq('show_id', showData.id)
        .eq('is_public', true)
        .eq('file_type', 'image')
        .order('display_order', { ascending: true })
        .limit(1);
      
      if (showFiles && Array.isArray(showFiles) && showFiles.length > 0) {
        showImageFiles = showFiles;
      }
    }
  }

  // Fetch files for audio and images
  const files = await getFilesByArrangementId(arrangementId);
  const audio = Array.isArray(files) ? files.find((f: any) => f.fileType === 'audio' && f.isPublic) : undefined;
  const arrangementImage = Array.isArray(files) ? files.find((f: any) => f.fileType === 'image' && f.isPublic) : undefined;

  // Use arrangement image, fallback to show graphic_url, show thumbnail_url, show image files, or null
  const showImageFile = showImageFiles.length > 0 ? showImageFiles[0] : null;
  const displayImage = arrangementImage?.url || parentShow?.graphicUrl || parentShow?.thumbnailUrl || showImageFile?.url || null;

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
    const value = String(arr.ensemble_size || '').toLowerCase();
    if (value === 'small') return 'Small Ensemble';
    if (value === 'medium') return 'Medium Ensemble';
    if (value === 'large') return 'Large Ensemble';
    return null;
  })();

  return (
    <div className="min-h-screen bg-background">
      <style dangerouslySetInnerHTML={{ __html: audioPlayerStyles }} />
      <JsonLd data={creativeWorkSchema} />

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
                    <Link href={`/shows/${parentShow.id}`}>{parentShow.title || parentShow.name}</Link>
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
                <Link href={`/shows/${parentShow.id}`} className="hover:underline">
                  {parentShow.title || parentShow.name}
                </Link>
              </p>
            )}

            {arr.description && (
              <p className="text-lg text-muted-foreground mb-6">{arr.description}</p>
            )}

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
              {arr.percussion_arranger && (
                <div className="flex items-center">
                  <Music className="w-4 h-4 text-muted-foreground mr-2" />
                  <span className="text-sm"><span className="font-medium">Percussion Arranger:</span> {arr.percussion_arranger}</span>
                </div>
              )}
              {arr.duration_seconds && (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-muted-foreground mr-2" />
                  <span className="text-sm"><span className="font-medium">Duration:</span> {formatSeconds(arr.duration_seconds)}</span>
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
              {arr.sample_score_url && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href={arr.sample_score_url} target="_blank" rel="noopener noreferrer">
                    <FileText className="w-4 h-4 mr-2" />
                    Download Sample Materials
                  </Link>
                </Button>
              )}
              {parentShow && (
                <Button variant="ghost" className="w-full" asChild>
                  <Link href={`/shows/${parentShow.id}`}>
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
                id: 'full', 
                title: arr.title || 'Full Arrangement', 
                duration: arr.duration_seconds ? formatSeconds(arr.duration_seconds) : '', 
                description: arr.description || '', 
                type: 'Full Track', 
                url: audio.url 
              }]}
              title="Arrangement Audio Preview"
              className="bg-card/80 backdrop-blur-sm"
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

        {/* Additional Files Section */}
        {files && files.length > 1 && (
          <div className="mb-12">
            <h2 className="text-2xl font-heading font-bold mb-4 text-foreground">Related Files</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.filter((f: any) => f.fileType !== 'audio' || !f.isPublic).map((file: any) => (
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
