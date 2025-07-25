import { ArrowLeft, Play, Download, Star, Clock, Music, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

const arrangements = [
  {
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
    thumbnail: "/placeholder.svg?height=200&width=300",
    description: "A powerful opening that sets the cosmic theme with ethereal soundscapes.",
    rating: 4.8,
    instruments: ["Brass", "Woodwinds", "Percussion", "Electronics"],
    showTitle: "Cosmic Journey",
  },
  {
    id: 2,
    title: "Nebula Dance",
    composer: "Bright Designs",
    year: "2024",
    difficulty: "Advanced",
    duration: "3:20",
    key: "F Major",
    tempo: "140 BPM",
    price: "$520",
    tags: ["Movement", "Colorful", "Energetic", "Space"],
    thumbnail: "/placeholder.svg?height=200&width=300",
    description: "Energetic and colorful, representing the swirling gases of distant nebulae.",
    rating: 4.9,
    instruments: ["Full Band", "Synthesizer", "Mallet Percussion"],
    showTitle: "Cosmic Journey",
  },
  {
    id: 3,
    title: "Urban Pulse",
    composer: "Bright Designs",
    year: "2024",
    difficulty: "Intermediate",
    duration: "3:15",
    key: "G Minor",
    tempo: "130 BPM",
    price: "$480",
    tags: ["Hip-Hop", "Urban", "Rhythmic", "Contemporary"],
    thumbnail: "/placeholder.svg?height=200&width=300",
    description: "Street-inspired rhythms with modern hip-hop influences.",
    rating: 4.7,
    instruments: ["Full Band", "Drum Set", "Bass Guitar"],
    showTitle: "Urban Legends",
  },
  {
    id: 4,
    title: "Renaissance March",
    composer: "Bright Designs",
    year: "2023",
    difficulty: "Advanced",
    duration: "4:10",
    key: "D Major",
    tempo: "110 BPM",
    price: "$550",
    tags: ["Classical", "Historical", "Orchestral", "Traditional"],
    thumbnail: "/placeholder.svg?height=200&width=300",
    description: "A majestic piece inspired by Renaissance court music.",
    rating: 4.8,
    instruments: ["Full Orchestra", "Timpani", "Brass Choir"],
    showTitle: "Renaissance Revival",
  },
  {
    id: 5,
    title: "Digital Dreamscape",
    composer: "Bright Designs",
    year: "2023",
    difficulty: "Beginner",
    duration: "2:30",
    key: "C Major",
    tempo: "100 BPM",
    price: "$350",
    tags: ["Electronic", "Beginner", "Synth", "Modern"],
    thumbnail: "/placeholder.svg?height=200&width=300",
    description: "Perfect introduction to electronic sounds for younger bands.",
    rating: 4.6,
    instruments: ["Concert Band", "Synthesizer", "Light Percussion"],
    showTitle: "Digital Dreams",
  },
  {
    id: 6,
    title: "Folk Celebration",
    composer: "Bright Designs",
    year: "2023",
    difficulty: "Intermediate",
    duration: "3:45",
    key: "A Major",
    tempo: "125 BPM",
    price: "$420",
    tags: ["Folk", "World", "Cultural", "Celebration"],
    thumbnail: "/placeholder.svg?height=200&width=300",
    description: "A joyful celebration of global folk traditions.",
    rating: 4.5,
    instruments: ["Full Band", "World Percussion", "Folk Instruments"],
    showTitle: "Folk Fusion",
  },
]

const allTags = Array.from(new Set(arrangements.flatMap((arr) => arr.tags)))

export default function ArrangementsPage() {
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

      {/* Page Header */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="flex items-center mb-6">
            <Button className="btn-ghost" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-bright-dark font-primary">
              Individual Arrangements
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Browse our complete catalog of individual arrangements. Each piece can be purchased separately or combined
              to create custom shows.
            </p>
          </div>

          {/* Filters */}
          <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="Search arrangements..." className="pl-10 w-64" />
              </div>
              <Select>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Difficulty Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Key" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Keys</SelectItem>
                  <SelectItem value="c">C Major</SelectItem>
                  <SelectItem value="bb">Bb Major</SelectItem>
                  <SelectItem value="f">F Major</SelectItem>
                  <SelectItem value="g">G Major</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="btn-outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>

          {/* Tags */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer hover:bg-bright-primary/10 hover:text-bright-third transition-colors"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Arrangements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {arrangements.map((arrangement) => (
              <Card
                key={arrangement.id}
                className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1 bg-white/80 backdrop-blur-sm"
              >
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={arrangement.thumbnail || "/placeholder.svg"}
                    alt={arrangement.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Button
                    size="sm"
                    className="btn-secondary btn-sm absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <div className="absolute top-4 right-4 flex items-center space-x-1 bg-white/90 rounded-full px-2 py-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-xs font-medium">{arrangement.rating}</span>
                  </div>
                  <div className="absolute top-4 left-4 bg-bright-primary text-bright-dark px-2 py-1 rounded-full text-sm font-medium">
                    {arrangement.price}
                  </div>
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl group-hover:text-bright-third transition-colors font-primary">
                      {arrangement.title}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {arrangement.year}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">{arrangement.description}</CardDescription>
                  <div className="text-xs text-bright-third font-medium">From: {arrangement.showTitle}</div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {arrangement.duration}
                    </div>
                    <div>{arrangement.difficulty}</div>
                    <div>{arrangement.key}</div>
                    <div>{arrangement.tempo}</div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {arrangement.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {arrangement.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{arrangement.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Button className="btn-primary w-full" asChild>
                      <Link href={`/arrangements/${arrangement.id}`}>View Details</Link>
                    </Button>
                    <Button className="btn-outline w-full btn-sm">
                      <Download className="w-4 h-4 mr-2" />
                      Sample Score
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
