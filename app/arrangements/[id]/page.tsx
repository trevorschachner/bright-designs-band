"use client"
import { ArrowLeft, Play, Download, Star, Clock, Music2, FileText, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { AudioPlayerComponent, audioPlayerStyles } from "@/components/features/audio-player"
import { useShowPlan } from "@/lib/hooks/use-show-plan"

// Mock data for a specific arrangement
const arrangementData = {
  id: 1,
  title: "Stellar Awakening",
  composer: "Bright Designs",
  year: "2024",
  difficulty: "Advanced",
  duration: "2:45",
  key: "Bb Major",
  tempo: "120 BPM",
  price: "$450",
  tags: ["Opening", "Electronic", "Space", "Ethereal"],
  thumbnail: "/placeholder.svg?height=400&width=600",
  description:
    "A powerful opening that sets the cosmic theme with ethereal soundscapes. This arrangement combines traditional marching band instrumentation with electronic elements to create an otherworldly atmosphere.",
  rating: 4.8,
  reviews: 15,
  showTitle: "Cosmic Journey",
  showId: 1,
  instruments: ["Brass", "Woodwinds", "Percussion", "Electronics"],
  // Mock audio tracks for the arrangement
  audioTracks: [
    {
      id: "1",
      title: "Full Arrangement - Studio Recording",
      duration: "2:45",
      description: "Complete studio recording with all parts",
      type: "Full Track",
      url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3" // Replace with actual audio URLs
    },
    {
      id: "2", 
      title: "Brass Section Only",
      duration: "2:45",
      description: "Isolated brass parts for learning",
      type: "Section Excerpt",
      url: "https://www.soundjay.com/misc/sounds/bell-ringing-04.mp3"
    },
    {
      id: "3",
      title: "Woodwind Section Only", 
      duration: "2:45",
      description: "Isolated woodwind parts for learning",
      type: "Section Excerpt",
      url: "https://www.soundjay.com/misc/sounds/bell-ringing-03.mp3"
    },
    {
      id: "4",
      title: "Percussion & Electronics",
      duration: "2:45", 
      description: "Rhythm section and electronic elements",
      type: "Section Excerpt",
      url: "https://www.soundjay.com/misc/sounds/bell-ringing-02.mp3"
    }
  ],
  detailedInstrumentation: {
    brass: ["Trumpet (4 parts)", "Horn (2 parts)", "Trombone (3 parts)", "Euphonium", "Tuba"],
    woodwinds: [
      "Piccolo",
      "Flute (2 parts)",
      "Clarinet (3 parts)",
      "Bass Clarinet",
      "Alto Sax (2 parts)",
      "Tenor Sax",
      "Bari Sax",
    ],
    percussion: ["Snare Drum", "Bass Drum", "Cymbals", "Timpani", "Mallet Percussion", "Auxiliary Percussion"],
    electronics: ["Synthesizer", "Sound Effects", "Backing Track"],
  },
  technicalRequirements: {
    minimumSize: "45 members",
    recommendedSize: "65-80 members",
    skillLevel: "Advanced High School / College",
    equipment: ["Sound system for electronics", "Synthesizer or keyboard"],
    specialNotes: [
      "Requires conductor comfortable with click track",
      "Electronic parts can be simplified for smaller ensembles",
    ],
  },
  musicalAnalysis: {
    form: "ABA with extended introduction",
    keyChanges: ["Bb Major (main)", "F Major (bridge)", "Return to Bb Major"],
    tempoChanges: ["Slow intro (80 BPM)", "Main theme (120 BPM)", "Accelerando to 140 BPM"],
    dynamics: "Builds from pp to ff with dramatic contrasts",
    style: "Contemporary with electronic fusion elements",
  },
}

export default function ArrangementDetailPage() {
  const { addToPlan } = useShowPlan();

  const handleAddToPlan = () => {
    addToPlan({
      id: arrangementData.id,
      title: arrangementData.title,
      type: 'arrangement',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      {/* Include custom audio player styles */}
      <style dangerouslySetInnerHTML={{ __html: audioPlayerStyles }} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center mb-6">
          <Button variant="ghost" className="mr-4" asChild>
            <Link href="/arrangements">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Arrangements
            </Link>
          </Button>
        </div>

        {/* Arrangement Header */}
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
              <Badge variant="outline" className="text-sm">{arrangementData.year}</Badge>
              <Badge variant="secondary" className="text-sm">{arrangementData.difficulty}</Badge>
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                <span className="text-sm font-medium">{arrangementData.rating}</span>
                <span className="text-sm text-gray-500 ml-1">({arrangementData.reviews} reviews)</span>
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-4 text-gray-900 font-primary">{arrangementData.title}</h1>
            <p className="text-lg text-bright-primary mb-4">
              From:{" "}
              <Link href={`/shows/${arrangementData.showId}`} className="hover:underline">
                {arrangementData.showTitle}
              </Link>
            </p>
            <p className="text-lg text-gray-600 mb-6">{arrangementData.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm">{arrangementData.duration}</span>
              </div>
              <div className="flex items-center">
                <Music2 className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm">{arrangementData.key}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm">{arrangementData.tempo}</span>
              </div>
              <div className="flex items-center">
                <FileText className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm">{arrangementData.composer}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {arrangementData.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="bg-card p-4 rounded-lg mb-6 border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-foreground">{arrangementData.price}</div>
                  <div className="text-sm text-muted-foreground">Individual Arrangement</div>
                </div>
                <Button size="lg" className="btn-primary px-6" onClick={handleAddToPlan}>
                  Add to Show Plan
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Sample Score
              </Button>
              <Button variant="outline">
                <Play className="w-4 h-4 mr-2" />
                Audio Preview
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="instrumentation" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="instrumentation">Instrumentation</TabsTrigger>
            <TabsTrigger value="audio">Audio Preview</TabsTrigger>
            <TabsTrigger value="analysis">Musical Analysis</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="instrumentation" className="mt-8">
            <Card className="frame-card">
              <CardHeader>
                <CardTitle className="font-primary">Complete Instrumentation</CardTitle>
                <CardDescription>All parts included in this arrangement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Brass Section</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {arrangementData.detailedInstrumentation.brass.map((instrument, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-2 h-2 bg-bright-primary rounded-full mr-2"></div>
                        {instrument}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Woodwind Section</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {arrangementData.detailedInstrumentation.woodwinds.map((instrument, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-2 h-2 bg-bright-third rounded-full mr-2"></div>
                        {instrument}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Percussion Section</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {arrangementData.detailedInstrumentation.percussion.map((instrument, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-2 h-2 bg-gray-600 rounded-full mr-2"></div>
                        {instrument}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Electronics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {arrangementData.detailedInstrumentation.electronics.map((instrument, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                        {instrument}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audio" className="mt-8">
            <AudioPlayerComponent 
              tracks={arrangementData.audioTracks}
              title="Arrangement Audio Preview"
              className="bg-white/80 backdrop-blur-sm"
            />
          </TabsContent>

          <TabsContent value="analysis" className="mt-8">
            <Card className="frame-card">
              <CardHeader>
                <CardTitle className="font-primary">Musical Analysis</CardTitle>
                <CardDescription>Detailed breakdown of the musical structure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Form</h4>
                  <p>{arrangementData.musicalAnalysis.form}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Key Changes</h4>
                  <ul className="list-better">
                    {arrangementData.musicalAnalysis.keyChanges.map((key, index) => (
                      <li key={index}>{key}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Tempo Changes</h4>
                  <ul className="list-better">
                    {arrangementData.musicalAnalysis.tempoChanges.map((tempo, index) => (
                      <li key={index}>{tempo}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Dynamics</h4>
                  <p>{arrangementData.musicalAnalysis.dynamics}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Style</h4>
                  <p>{arrangementData.musicalAnalysis.style}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requirements" className="mt-8">
            <Card className="frame-card">
              <CardHeader>
                <CardTitle className="font-primary">Performance Requirements</CardTitle>
                <CardDescription>Technical requirements for this arrangement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Ensemble Size</h4>
                  <p>Minimum: {arrangementData.technicalRequirements.minimumSize}</p>
                  <p>Recommended: {arrangementData.technicalRequirements.recommendedSize}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Skill Level</h4>
                  <p>{arrangementData.technicalRequirements.skillLevel}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Equipment Needed</h4>
                  <ul className="list-better">
                    {arrangementData.technicalRequirements.equipment.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Special Notes</h4>
                  <ul className="list-better">
                    {arrangementData.technicalRequirements.specialNotes.map((note, index) => (
                      <li key={index}>{note}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-8">
            <Card className="frame-card">
              <CardHeader>
                <CardTitle className="font-primary">Customer Reviews</CardTitle>
                <CardDescription>What directors are saying about this arrangement</CardDescription>
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
