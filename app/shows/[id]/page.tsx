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
      arrangements: true,
    },
  });

  if (!show) {
    return <div>Show not found</div>;
  }

  // Mock data with integrated audio URLs
  const mockData = {
    arrangements: [
      {
        id: 1,
        title: "Stellar Awakening",
        movement: "Opening",
        duration: "2:45",
        description: "A powerful opening that sets the cosmic theme with ethereal soundscapes.",
        key: "Bb Major",
        tempo: "120 BPM",
        instrumentation: "Brass, Woodwinds, Percussion, Electronics",
        price: 450,
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-04.mp3"
      },
      {
        id: 2,
        title: "Nebula Dance",
        movement: "First Movement",
        duration: "3:20",
        description: "Energetic and colorful, representing the swirling gases of distant nebulae.",
        key: "F Major",
        tempo: "140 BPM",
        instrumentation: "Full Band, Synthesizer, Mallet Percussion",
        price: 520,
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-03.mp3"
      },
      {
        id: 3,
        title: "Black Hole",
        movement: "Second Movement",
        duration: "2:50",
        description: "A dramatic piece that builds from mysterious to intense, representing gravitational pull.",
        key: "D Minor",
        tempo: "90-160 BPM",
        instrumentation: "Low Brass, Timpani, Electronics, Full Ensemble",
        price: 480,
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-02.mp3"
      },
      {
        id: 4,
        title: "Galactic Finale",
        movement: "Closer",
        duration: "2:35",
        description: "An explosive finale that brings all themes together in cosmic harmony.",
        key: "Bb Major",
        tempo: "150 BPM",
        instrumentation: "Full Band, Auxiliary Percussion, Electronics",
        price: 550,
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-01.mp3"
      }
    ]
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
          <div className="relative">
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
              <Badge variant="secondary" className="text-sm">{show.difficulty}</Badge>
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
                <span className="text-sm">{mockData.arrangements.length} Arrangements</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {show.showsToTags.map((relation) => (
                <Badge key={relation.tag.id} variant="outline" className="text-xs">
                  {relation.tag.name}
                </Badge>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <CheckAvailabilityModal showTitle={show.title} />
              <Button variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download Sample Materials
              </Button>
            </div>
          </div>
        </div>

        {/* Show Arrangements Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-foreground font-primary">Show Arrangements</h2>
            <Badge variant="secondary" className="text-sm">
              {mockData.arrangements.length} Movements
            </Badge>
          </div>
          
          {mockData.arrangements.map((arrangement, index) => (
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
                      <p className="text-bright-primary font-medium flex items-center gap-2">
                        <Music2 className="w-4 h-4" />
                        {arrangement.movement} • {arrangement.duration}
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-3 leading-relaxed ml-[52px]">
                    {arrangement.description}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="px-6 py-4 bg-muted/20">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-bright-primary/10 flex items-center justify-center flex-shrink-0">
                        <Music className="w-4 h-4 text-bright-primary" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Key</div>
                        <div className="font-semibold text-foreground">{arrangement.key}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-bright-third/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-bright-third" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Tempo</div>
                        <div className="font-semibold text-foreground">{arrangement.tempo}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Instrumentation</div>
                        <div className="font-semibold text-foreground text-xs leading-tight">{arrangement.instrumentation}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audio Player */}
                <div className="px-6 py-4 bg-card border-t">
                  <div className="flex items-center gap-3 mb-2">
                    <Play className="w-4 h-4 text-bright-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Audio Preview</span>
                  </div>
                  <audio 
                    controls 
                    className="w-full h-10 rounded-lg"
                    preload="metadata"
                  >
                    <source src={arrangement.audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>

                {/* Action Buttons */}
                <div className="px-6 py-5 bg-muted/10 border-t">
                  <div className="flex flex-wrap gap-3">
                    <Button variant="default" size="default" className="btn-primary flex-1 sm:flex-none" asChild>
                      <Link href={`/arrangements/${arrangement.id}`}>
                        <FileText className="w-4 h-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                    <Button variant="outline" size="default" className="flex-1 sm:flex-none">
                      <Download className="w-4 h-4 mr-2" />
                      Download Materials
                    </Button>
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
