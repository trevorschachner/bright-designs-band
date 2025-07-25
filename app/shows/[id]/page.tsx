import { ArrowLeft, Play, Download, Star, Clock, Users, Music2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

// Mock data for a specific show
const showData = {
  id: 1,
  title: "Cosmic Journey",
  year: "2024",
  difficulty: "Advanced",
  duration: "11:30",
  price: "$2,500",
  tags: ["Space", "Electronic", "Modern", "Competition"],
  thumbnail: "/placeholder.svg?height=400&width=600",
  description:
    "An otherworldly experience combining electronic soundscapes with traditional marching band arrangements. This show takes your audience on a journey through the cosmos, featuring innovative drill design and cutting-edge musical arrangements.",
  rating: 4.9,
  reviews: 23,
  arrangements: [
    {
      id: 1,
      title: "Stellar Awakening",
      movement: "Opening",
      duration: "2:45",
      key: "Bb Major",
      tempo: "120 BPM",
      description: "A powerful opening that sets the cosmic theme with ethereal soundscapes.",
      price: "$450",
      instruments: ["Brass", "Woodwinds", "Percussion", "Electronics"],
    },
    {
      id: 2,
      title: "Nebula Dance",
      movement: "First Movement",
      duration: "3:20",
      key: "F Major",
      tempo: "140 BPM",
      description: "Energetic and colorful, representing the swirling gases of distant nebulae.",
      price: "$520",
      instruments: ["Full Band", "Synthesizer", "Mallet Percussion"],
    },
    {
      id: 3,
      title: "Black Hole",
      movement: "Second Movement",
      duration: "2:50",
      key: "D Minor",
      tempo: "90-160 BPM",
      description: "A dramatic piece that builds from mysterious to intense, representing gravitational pull.",
      price: "$480",
      instruments: ["Low Brass", "Timpani", "Electronics", "Full Ensemble"],
    },
    {
      id: 4,
      title: "Galactic Finale",
      movement: "Closer",
      duration: "2:35",
      key: "Bb Major",
      tempo: "150 BPM",
      description: "An explosive finale that brings all themes together in cosmic harmony.",
      price: "$550",
      instruments: ["Full Band", "Auxiliary Percussion", "Electronics"],
    },
  ],
  features: [
    "Complete drill design included",
    "Audio recordings for all movements",
    "Individual part scores",
    "Conductor's score and analysis",
    "Costume and prop suggestions",
    "Choreography notes",
  ],
  requirements: {
    minimumSize: "45 members",
    recommendedSize: "65-80 members",
    skillLevel: "Advanced High School / College",
    equipment: ["Sound system for electronics", "Basic lighting preferred"],
  },
}

export default function ShowDetailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-bright-primary rounded-lg flex items-center justify-center">
                <Music2 className="w-5 h-5 text-bright-dark" />
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
              <Link href="/process" className="text-gray-600 hover:text-bright-third transition-colors">
                Process
              </Link>
              <Button
                variant="outline"
                className="border-bright-secondary text-bright-dark hover:bg-bright-primary/10 bg-transparent"
                asChild
              >
                <Link href="/contact">Contact Us</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

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
          <div className="relative">
            <img
              src={showData.thumbnail || "/placeholder.svg"}
              alt={showData.title}
              className="w-full h-80 object-cover rounded-lg shadow-lg"
            />
            <Button
              size="lg"
              className="btn-secondary btn-lg absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            >
              <Play className="w-6 h-6 mr-2" />
              Play Preview
            </Button>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">{showData.year}</Badge>
              <Badge variant="secondary">{showData.difficulty}</Badge>
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                <span className="text-sm font-medium">{showData.rating}</span>
                <span className="text-sm text-gray-500 ml-1">({showData.reviews} reviews)</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 text-bright-dark font-primary">{showData.title}</h1>
            <p className="text-lg text-gray-600 mb-6">{showData.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-gray-400 mr-2" />
                <span>{showData.duration}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-5 h-5 text-gray-400 mr-2" />
                <span>{showData.arrangements.length} Arrangements</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {showData.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between p-4 bg-bright-primary/10 rounded-lg mb-6">
              <div>
                <div className="text-2xl font-bold text-bright-dark">{showData.price}</div>
                <div className="text-sm text-gray-600">Complete Show Package</div>
              </div>
              <Button size="lg" className="btn-primary btn-lg">
                Purchase Show
              </Button>
            </div>

            <Button className="btn-outline w-full mb-4">
              <Download className="w-4 h-4 mr-2" />
              Download Sample Materials
            </Button>
          </div>
        </div>

        {/* Detailed Information */}
        <Tabs defaultValue="arrangements" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="arrangements">Arrangements</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="arrangements" className="mt-6">
            <div className="grid gap-6">
              <h3 className="text-2xl font-bold text-bright-dark font-primary mb-4">Show Arrangements</h3>
              {showData.arrangements.map((arrangement, index) => (
                <Card key={arrangement.id} className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-primary">{arrangement.title}</CardTitle>
                        <CardDescription className="text-bright-third font-medium">
                          {arrangement.movement} • {arrangement.duration}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-bright-dark">{arrangement.price}</div>
                        <div className="text-sm text-gray-500">Individual</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{arrangement.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Key:</span>
                        <div>{arrangement.key}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Tempo:</span>
                        <div>{arrangement.tempo}</div>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium text-gray-700">Instrumentation:</span>
                        <div>{arrangement.instruments.join(", ")}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" className="btn-outline btn-sm" asChild>
                        <Link href={`/arrangements/${arrangement.id}`}>
                          <FileText className="w-4 h-4 mr-2" />
                          View Details
                        </Link>
                      </Button>
                      <Button size="sm" className="btn-ghost btn-sm">
                        <Play className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="features" className="mt-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-primary">What's Included</CardTitle>
                <CardDescription>Everything you need for a complete performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {showData.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <div className="w-2 h-2 bg-bright-primary rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requirements" className="mt-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-primary">Performance Requirements</CardTitle>
                <CardDescription>Technical and ensemble requirements for this show</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Ensemble Size</h4>
                  <p>Minimum: {showData.requirements.minimumSize}</p>
                  <p>Recommended: {showData.requirements.recommendedSize}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Skill Level</h4>
                  <p>{showData.requirements.skillLevel}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Equipment Needed</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {showData.requirements.equipment.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-primary">Customer Reviews</CardTitle>
                <CardDescription>What directors are saying about this show</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">Reviews coming soon...</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
