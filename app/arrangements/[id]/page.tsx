import { ArrowRight, Music, Users, Star, Clock, Download, Play, Heart, Share, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

// This would typically come from a database or API
const getArrangementById = (id: string) => {
  const arrangements = [
    {
      id: 1,
      title: "Bohemian Rhapsody",
      artist: "Queen",
      genre: "Rock",
      difficulty: "Advanced",
      duration: "5:45",
      price: 89,
      thumbnail: "/placeholder.svg?height=400&width=600",
      description: "A faithful arrangement of Queen's masterpiece, complete with all the dynamic shifts and vocal sections.",
      instrumentation: "Full Band",
      rating: 4.9,
      downloads: 342,
      fullDescription: "This epic arrangement of Queen's Bohemian Rhapsody captures all the drama and complexity of the original masterpiece. From the gentle piano opening to the thunderous rock finale, every section has been carefully crafted to showcase your marching band's full potential. The arrangement features multiple tempo changes, dynamic vocal line translations for brass and woodwinds, and an incredible guitar solo section that will leave audiences speechless.",
      keySignature: "Bb Major (modulates to Eb Major)",
      timeSignature: "4/4 (with rubato sections)",
      tempoMarkings: [
        "Intro: Slowly (♩ = 72)",
        "Ballad: Moderately (♩ = 96)",
        "Opera: Allegro (♩ = 144)",
        "Rock: Driving (♩ = 120)"
      ],
      technicalRequirements: {
        range: {
          trumpet: "G3 to C6",
          trombone: "Bb1 to F4",
          clarinet: "E3 to G6",
          saxophone: "Bb2 to F#5"
        },
        skills: [
          "Advanced dynamics control",
          "Quick tempo changes",
          "Extended techniques",
          "Ensemble precision",
          "Solo performance ability"
        ]
      },
      sections: [
        { name: "Intro", measures: "1-24", description: "Gentle piano-style opening with delicate woodwind textures" },
        { name: "Ballad", measures: "25-84", description: "Lyrical melody featuring brass and woodwind solos" },
        { name: "Opera", measures: "85-132", description: "Dramatic operatic section with full ensemble" },
        { name: "Rock", measures: "133-180", description: "Powerful rock anthem conclusion" }
      ],
      includes: [
        "Full Score (PDF)",
        "Individual Parts (PDF)",
        "Practice Audio Files",
        "Conductor's Notes",
        "Performance License",
        "Technique Exercises",
        "Rehearsal Guide"
      ],
      samplePages: [
        "/placeholder.svg?height=600&width=400&text=Score+Page+1",
        "/placeholder.svg?height=600&width=400&text=Score+Page+2",
        "/placeholder.svg?height=600&width=400&text=Score+Page+3"
      ]
    }
  ]
  
  return arrangements.find(arr => arr.id === parseInt(id)) || arrangements[0]
}

export default function ArrangementDetailPage({ params }: { params: { id: string } }) {
  const arrangement = getArrangementById(params.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-bright-primary rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-bright-dark" />
              </div>
              <span className="text-xl font-bold text-bright-dark font-primary">Bright Designs</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/shows" className="text-gray-600 hover:text-bright-third transition-colors">
                Shows
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-bright-third transition-colors">
                About
              </Link>
              <Link href="/arrangements" className="text-bright-third font-medium">
                Arrangements
              </Link>
              <Link href="/contact">
                <Button
                  variant="outline"
                  className="border-bright-secondary text-bright-dark hover:bg-bright-primary/10 bg-transparent"
                >
                  Contact Us
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <section className="py-4 px-4 bg-white/50">
        <div className="container mx-auto">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-bright-third">Home</Link>
            <span>/</span>
            <Link href="/arrangements" className="hover:text-bright-third">Arrangements</Link>
            <span>/</span>
            <span className="text-bright-dark font-medium">{arrangement.title}</span>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <Badge variant="outline" className="text-sm">
                  {arrangement.genre}
                </Badge>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{arrangement.rating}</span>
                </div>
                <div className="flex items-center space-x-1 text-gray-600">
                  <Download className="w-4 h-4" />
                  <span className="text-sm">{arrangement.downloads} downloads</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-4 text-bright-dark font-primary">
                {arrangement.title}
              </h1>
              <p className="text-xl text-gray-600 mb-2">by {arrangement.artist}</p>
              <p className="text-lg text-gray-600 mb-6">{arrangement.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-bright-primary mb-1">{arrangement.difficulty}</div>
                  <div className="text-sm text-gray-600">Difficulty</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-bright-third mb-1">{arrangement.duration}</div>
                  <div className="text-sm text-gray-600">Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-bright-secondary mb-1">{arrangement.instrumentation}</div>
                  <div className="text-sm text-gray-600">Ensemble</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-bright-primary mb-1">${arrangement.price}</div>
                  <div className="text-sm text-gray-600">Complete Set</div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  className="bg-bright-primary hover:bg-bright-primary/90 text-bright-dark font-medium flex-1"
                >
                  <ShoppingCart className="mr-2 w-5 h-5" />
                  Add to Cart - ${arrangement.price}
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-bright-secondary text-bright-dark hover:bg-bright-primary/10"
                >
                  <Play className="mr-2 w-5 h-5" />
                  Preview Audio
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-bright-secondary text-bright-dark hover:bg-bright-primary/10"
                >
                  <Heart className="w-5 h-5" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-bright-secondary text-bright-dark hover:bg-bright-primary/10"
                >
                  <Share className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <img
                src={arrangement.thumbnail}
                alt={arrangement.title}
                className="w-full h-96 object-cover rounded-lg shadow-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg" />
              <Button
                size="lg"
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 text-gray-900 hover:bg-white"
              >
                <Play className="w-6 h-6 mr-2" />
                Listen to Sample
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Information */}
      <section className="py-16 px-4 bg-white/50">
        <div className="container mx-auto">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="technical">Technical Details</TabsTrigger>
              <TabsTrigger value="sections">Sections</TabsTrigger>
              <TabsTrigger value="preview">Score Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold mb-4 font-primary">About This Arrangement</h3>
                  <p className="text-gray-600 mb-6">{arrangement.fullDescription}</p>
                  
                  <h4 className="text-lg font-semibold mb-3 text-bright-dark">Musical Details</h4>
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Key Signature:</span>
                      <span className="font-medium">{arrangement.keySignature}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time Signature:</span>
                      <span className="font-medium">{arrangement.timeSignature}</span>
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-semibold mb-3 text-bright-dark">Tempo Markings</h4>
                  <ul className="space-y-1">
                    {arrangement.tempoMarkings.map((tempo, index) => (
                      <li key={index} className="text-gray-600 text-sm">• {tempo}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold mb-4 font-primary">What's Included</h3>
                  <div className="space-y-3">
                    {arrangement.includes.map((item, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                        <Download className="w-5 h-5 text-bright-primary flex-shrink-0" />
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="technical" className="mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold mb-4 font-primary">Range Requirements</h3>
                  <div className="space-y-4">
                    {Object.entries(arrangement.technicalRequirements.range).map(([instrument, range]) => (
                      <div key={instrument} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                        <span className="font-medium capitalize">{instrument}:</span>
                        <span className="text-gray-600">{range}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold mb-4 font-primary">Required Skills</h3>
                  <div className="space-y-2">
                    {arrangement.technicalRequirements.skills.map((skill, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                        <div className="w-2 h-2 bg-bright-primary rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700">{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="sections" className="mt-8">
              <h3 className="text-2xl font-bold mb-6 font-primary">Arrangement Sections</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {arrangement.sections.map((section, index) => (
                  <Card key={index} className="border-0 shadow-lg">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="font-primary">{section.name}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          mm. {section.measures}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{section.description}</CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="preview" className="mt-8">
              <h3 className="text-2xl font-bold mb-6 font-primary">Score Preview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {arrangement.samplePages.map((page, index) => (
                  <Card key={index} className="border-0 shadow-lg overflow-hidden">
                    <img
                      src={page}
                      alt={`Score page ${index + 1}`}
                      className="w-full h-64 object-cover"
                    />
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600">Page {index + 1}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-6 p-4 bg-bright-primary/10 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Note:</strong> These are sample pages. The complete arrangement includes full score and all individual parts.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-bright-third">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h2 className="text-4xl font-bold mb-6 font-primary">Ready to Perform {arrangement.title}?</h2>
            <p className="text-xl mb-8 opacity-90">
              Download this incredible arrangement instantly and start rehearsing today. Perfect for concerts, competitions, and special events.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-bright-dark hover:bg-gray-100 text-lg px-8 py-6 font-medium"
              >
                <ShoppingCart className="mr-2 w-5 h-5" />
                Purchase Now - ${arrangement.price}
              </Button>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 text-lg px-8 py-6 bg-transparent"
                >
                  Request Custom Version
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}