import { ArrowRight, Music, Users, Star, Clock, Download, Play, Heart, Share } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

// This would typically come from a database or API
const getShowById = (id: string) => {
  const shows = [
    {
      id: 1,
      title: "Cosmic Journey",
      year: "2024",
      difficulty: "Advanced",
      duration: "11:30",
      tags: ["Space", "Electronic", "Modern", "Competition"],
      thumbnail: "/placeholder.svg?height=400&width=600",
      description: "An otherworldly experience combining electronic soundscapes with traditional marching band arrangements.",
      arrangements: 4,
      rating: 4.9,
      price: 450,
      fullDescription: "Cosmic Journey takes your audience on an interstellar adventure through time and space. This cutting-edge production seamlessly blends electronic synthesizers with traditional brass and percussion to create an otherworldly sonic landscape. The show features four distinct movements: Launch, Nebula Dance, Black Hole, and Return to Earth, each with its own unique musical and visual identity.",
      movements: [
        { name: "Launch", duration: "2:45", description: "High-energy opening with powerful brass fanfares and driving percussion" },
        { name: "Nebula Dance", duration: "3:20", description: "Ethereal and mysterious with floating melodies and ambient textures" },
        { name: "Black Hole", duration: "3:15", description: "Intense and dramatic featuring complex rhythms and dissonant harmonies" },
        { name: "Return to Earth", duration: "2:10", description: "Triumphant finale bringing the journey full circle" }
      ],
      instrumentation: {
        winds: "3 Flutes, 4 Clarinets, 3 Alto Saxes, 2 Tenor Saxes, 1 Bari Sax",
        brass: "4 Trumpets, 4 French Horns, 3 Trombones, 2 Euphoniums, 2 Tubas",
        percussion: "5 Battery, 4 Front Ensemble",
        electronics: "Synthesizer, Sound Effects Track"
      },
      requirements: {
        minimumSize: 45,
        recommendedSize: 65,
        skillLevel: "Advanced High School / College",
        rehearsalTime: "12-16 weeks"
      },
      includes: [
        "Full Score and Parts",
        "Drill Design and Formations",
        "Electronics and Click Track",
        "Costume Design Concepts",
        "Prop Design Sketches",
        "Video Tutorial Series",
        "Performance Rights"
      ]
    }
  ]
  
  return shows.find(show => show.id === parseInt(id)) || shows[0]
}

export default function ShowDetailPage({ params }: { params: { id: string } }) {
  const show = getShowById(params.id)

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
              <Link href="/shows" className="text-bright-third font-medium">
                Shows
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-bright-third transition-colors">
                About
              </Link>
              <Link href="/arrangements" className="text-gray-600 hover:text-bright-third transition-colors">
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
            <Link href="/shows" className="hover:text-bright-third">Shows</Link>
            <span>/</span>
            <span className="text-bright-dark font-medium">{show.title}</span>
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
                  {show.year}
                </Badge>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{show.rating}</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-bright-dark font-primary">
                {show.title}
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                {show.description}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-bright-primary mb-1">{show.difficulty}</div>
                  <div className="text-sm text-gray-600">Difficulty</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-bright-third mb-1">{show.duration}</div>
                  <div className="text-sm text-gray-600">Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-bright-secondary mb-1">{show.arrangements}</div>
                  <div className="text-sm text-gray-600">Movements</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-bright-primary mb-1">${show.price}</div>
                  <div className="text-sm text-gray-600">Complete Show</div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  className="bg-bright-primary hover:bg-bright-primary/90 text-bright-dark font-medium flex-1"
                >
                  Purchase Show - ${show.price}
                  <ArrowRight className="ml-2 w-5 h-5" />
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
                src={show.thumbnail}
                alt={show.title}
                className="w-full h-96 object-cover rounded-lg shadow-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg" />
              <Button
                size="lg"
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 text-gray-900 hover:bg-white"
              >
                <Play className="w-6 h-6 mr-2" />
                Watch Preview
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
              <TabsTrigger value="movements">Movements</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="includes">What's Included</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold mb-4 font-primary">About This Show</h3>
                  <p className="text-gray-600 mb-6">{show.fullDescription}</p>
                  <div className="flex flex-wrap gap-2">
                    {show.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-4 font-primary">Instrumentation</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-bright-dark">Winds</h4>
                      <p className="text-gray-600 text-sm">{show.instrumentation.winds}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-bright-dark">Brass</h4>
                      <p className="text-gray-600 text-sm">{show.instrumentation.brass}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-bright-dark">Percussion</h4>
                      <p className="text-gray-600 text-sm">{show.instrumentation.percussion}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-bright-dark">Electronics</h4>
                      <p className="text-gray-600 text-sm">{show.instrumentation.electronics}</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="movements" className="mt-8">
              <h3 className="text-2xl font-bold mb-6 font-primary">Show Movements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {show.movements.map((movement, index) => (
                  <Card key={index} className="border-0 shadow-lg">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="font-primary">{movement.name}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {movement.duration}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{movement.description}</CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="requirements" className="mt-8">
              <h3 className="text-2xl font-bold mb-6 font-primary">Performance Requirements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="text-center border-0 shadow-lg">
                  <CardHeader>
                    <Users className="w-8 h-8 text-bright-primary mx-auto mb-2" />
                    <CardTitle className="text-lg">Minimum Size</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bright-dark">{show.requirements.minimumSize}</div>
                    <div className="text-sm text-gray-600">performers</div>
                  </CardContent>
                </Card>
                <Card className="text-center border-0 shadow-lg">
                  <CardHeader>
                    <Users className="w-8 h-8 text-bright-third mx-auto mb-2" />
                    <CardTitle className="text-lg">Recommended</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bright-dark">{show.requirements.recommendedSize}</div>
                    <div className="text-sm text-gray-600">performers</div>
                  </CardContent>
                </Card>
                <Card className="text-center border-0 shadow-lg">
                  <CardHeader>
                    <Star className="w-8 h-8 text-bright-secondary mx-auto mb-2" />
                    <CardTitle className="text-lg">Skill Level</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-medium text-bright-dark text-center">{show.requirements.skillLevel}</div>
                  </CardContent>
                </Card>
                <Card className="text-center border-0 shadow-lg">
                  <CardHeader>
                    <Clock className="w-8 h-8 text-bright-primary mx-auto mb-2" />
                    <CardTitle className="text-lg">Rehearsal Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-medium text-bright-dark text-center">{show.requirements.rehearsalTime}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="includes" className="mt-8">
              <h3 className="text-2xl font-bold mb-6 font-primary">What's Included</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {show.includes.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
                    <Download className="w-5 h-5 text-bright-primary" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-bright-third">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h2 className="text-4xl font-bold mb-6 font-primary">Ready to Bring {show.title} to Life?</h2>
            <p className="text-xl mb-8 opacity-90">
              Transform your marching band with this incredible show. Download immediately or contact us for customization options.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-bright-dark hover:bg-gray-100 text-lg px-8 py-6 font-medium"
              >
                Purchase Complete Show - ${show.price}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 text-lg px-8 py-6 bg-transparent"
                >
                  Request Customization
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}