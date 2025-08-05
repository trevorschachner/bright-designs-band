import { createClient } from '@/utils/supabase/server'
import { eq } from 'drizzle-orm'
import { shows } from '@/lib/db/schema'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Star, Clock, Users, Download, Play, Calendar, Music, Target, ArrowLeft, FileText } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { AudioPlayerComponent } from '@/app/components/audio-player'

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

  // Mock data to match the screenshot design
  const mockData = {
    rating: 4.9,
    reviewCount: 23,
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
        price: 450
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
        price: 520
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
        price: 480
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
        price: 550
      }
    ],
    // Mock audio tracks for the show
    audioTracks: [
      {
        id: "1",
        title: "Complete Show - Studio Recording",
        duration: "11:30",
        description: "Full performance recording of all movements",
        type: "Full Show",
        url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3" // Replace with actual audio URLs
      },
      {
        id: "2", 
        title: "Stellar Awakening",
        duration: "2:45",
        description: "Opening movement preview",
        type: "Movement Preview",
        url: "https://www.soundjay.com/misc/sounds/bell-ringing-04.mp3"
      },
      {
        id: "3",
        title: "Nebula Dance", 
        duration: "3:20",
        description: "First movement preview",
        type: "Movement Preview",
        url: "https://www.soundjay.com/misc/sounds/bell-ringing-03.mp3"
      },
      {
        id: "4",
        title: "Black Hole",
        duration: "2:50", 
        description: "Second movement preview",
        type: "Movement Preview",
        url: "https://www.soundjay.com/misc/sounds/bell-ringing-02.mp3"
      },
      {
        id: "5",
        title: "Galactic Finale",
        duration: "2:35",
        description: "Closer movement preview", 
        type: "Movement Preview",
        url: "https://www.soundjay.com/misc/sounds/bell-ringing-01.mp3"
      }
    ]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      {/* Audio player styles are now included in globals.css */}
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center mb-6">
          <Button variant="ghost" className="mr-4" asChild>
            <Link href="/shows">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Shows
            </Link>
          </Button>
        </div>

        {/* Show Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left side - Image */}
          <div className="relative">
            <div className="w-full h-80 bg-gray-200 rounded-lg shadow-lg flex items-center justify-center">
              <div className="text-gray-400">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
              </div>
            </div>
            <Button
              size="lg"
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 text-gray-900 hover:bg-white shadow-lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Play Preview
            </Button>
          </div>

          {/* Right side - Content */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="outline" className="text-sm">{show.year}</Badge>
              <Badge variant="secondary" className="text-sm">{show.difficulty}</Badge>
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                <span className="text-sm font-medium">{mockData.rating}</span>
                <span className="text-sm text-gray-500 ml-1">({mockData.reviewCount} reviews)</span>
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-4 text-gray-900 font-primary">{show.title}</h1>
            <p className="text-lg text-gray-600 mb-6">{show.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm">{show.duration}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 text-gray-400 mr-2" />
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

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">${show.price || '2,500'}</div>
                  <div className="text-sm text-gray-600">Complete Show Package</div>
                </div>
                <Button size="lg" className="bg-bright-primary hover:bg-yellow-400 text-gray-900 font-medium px-6">
                  Purchase Show
                </Button>
              </div>
            </div>

            <Button variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download Sample Materials
            </Button>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="arrangements" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="arrangements">Arrangements</TabsTrigger>
            <TabsTrigger value="audio">Audio Preview</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="arrangements" className="mt-8">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 font-primary">Show Arrangements</h2>
              
              {mockData.arrangements.map((arrangement, index) => (
                <Card key={arrangement.id} className="bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">{arrangement.title}</h3>
                        <p className="text-bright-primary font-medium">{arrangement.movement} • {arrangement.duration}</p>
                        <p className="text-gray-600 mt-2">{arrangement.description}</p>
                      </div>
                      <div className="text-right ml-6">
                        <div className="text-xl font-bold text-gray-900">${arrangement.price}</div>
                        <div className="text-sm text-gray-500">Individual</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-medium">Key:</span>
                        <br />
                        {arrangement.key}
                      </div>
                      <div>
                        <span className="font-medium">Tempo:</span>
                        <br />
                        {arrangement.tempo}
                      </div>
                      <div>
                        <span className="font-medium">Instrumentation:</span>
                        <br />
                        {arrangement.instrumentation}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/arrangements/${arrangement.id}`}>
                          <FileText className="w-4 h-4 mr-2" />
                          View Details
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Play className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="audio" className="mt-8">
            <AudioPlayerComponent 
              tracks={mockData.audioTracks}
              title="Show Audio Preview"
              className="bg-white/80 backdrop-blur-sm"
            />
          </TabsContent>

          <TabsContent value="features" className="mt-8">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Show Features</CardTitle>
                <CardDescription>What makes this show special</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Innovative Instrumentation</h4>
                    <p className="text-gray-600">Combines traditional marching band with electronic elements for a modern sound.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Visual Design Integration</h4>
                    <p className="text-gray-600">Music specifically composed to support dramatic drill movements and formations.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Educational Value</h4>
                    <p className="text-gray-600">Develops advanced musical skills while engaging audiences with compelling themes.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requirements" className="mt-8">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Performance Requirements</CardTitle>
                <CardDescription>Technical requirements for this show</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Ensemble Size</h4>
                    <p>Minimum: 45 members</p>
                    <p>Recommended: 65-80 members</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Skill Level</h4>
                    <p>{show.difficulty} - Suitable for competitive high school and college programs</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Equipment Needed</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>Sound system for electronic elements</li>
                      <li>Synthesizer or keyboard</li>
                      <li>Extended percussion setup</li>
                      <li>Click track capability</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-8">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Customer Reviews</CardTitle>
                <CardDescription>What directors are saying about this show</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Reviews coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
