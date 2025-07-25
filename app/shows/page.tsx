import { ArrowRight, Filter, Play, Music, Users, Star, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

const shows = [
  {
    id: 1,
    title: "Cosmic Journey",
    year: "2024",
    difficulty: "Advanced",
    duration: "11:30",
    tags: ["Space", "Electronic", "Modern", "Competition"],
    thumbnail: "/placeholder.svg?height=200&width=300",
    description:
      "An otherworldly experience combining electronic soundscapes with traditional marching band arrangements.",
    arrangements: 4,
    rating: 4.9,
  },
  {
    id: 2,
    title: "Urban Legends",
    year: "2024",
    difficulty: "Intermediate",
    duration: "9:45",
    tags: ["Hip-Hop", "Urban", "Contemporary", "Street"],
    thumbnail: "/placeholder.svg?height=200&width=300",
    description: "Street-inspired rhythms meet classical marching band in this urban masterpiece.",
    arrangements: 3,
    rating: 4.7,
  },
  {
    id: 3,
    title: "Renaissance Revival",
    year: "2023",
    difficulty: "Advanced",
    duration: "12:15",
    tags: ["Classical", "Historical", "Orchestral", "Traditional"],
    thumbnail: "/placeholder.svg?height=200&width=300",
    description: "A journey through the Renaissance period with modern marching band interpretation.",
    arrangements: 5,
    rating: 4.8,
  },
  {
    id: 4,
    title: "Digital Dreams",
    year: "2023",
    difficulty: "Beginner",
    duration: "8:20",
    tags: ["Electronic", "Futuristic", "Synth", "Modern"],
    thumbnail: "/placeholder.svg?height=200&width=300",
    description: "Perfect for younger bands exploring electronic and synthesized sounds.",
    arrangements: 3,
    rating: 4.6,
  },
  {
    id: 5,
    title: "Folk Fusion",
    year: "2023",
    difficulty: "Intermediate",
    duration: "10:30",
    tags: ["Folk", "World", "Cultural", "Traditional"],
    thumbnail: "/placeholder.svg?height=200&width=300",
    description: "Celebrating global folk traditions through innovative marching band arrangements.",
    arrangements: 4,
    rating: 4.5,
  },
  {
    id: 6,
    title: "Neon Nights",
    year: "2022",
    difficulty: "Advanced",
    duration: "11:00",
    tags: ["80s", "Retro", "Synthwave", "Pop"],
    thumbnail: "/placeholder.svg?height=200&width=300",
    description: "A nostalgic trip through the neon-soaked sounds of the 1980s.",
    arrangements: 4,
    rating: 4.9,
  },
  {
    id: 7,
    title: "Elemental Forces",
    year: "2024",
    difficulty: "Advanced",
    duration: "10:45",
    tags: ["Nature", "Orchestral", "Epic", "Competition"],
    thumbnail: "/placeholder.svg?height=200&width=300",
    description: "Harness the power of earth, wind, fire, and water in this dynamic production.",
    arrangements: 4,
    rating: 4.8,
  },
  {
    id: 8,
    title: "Jazz Cafe",
    year: "2023",
    difficulty: "Intermediate",
    duration: "9:15",
    tags: ["Jazz", "Swing", "Classic", "Fun"],
    thumbnail: "/placeholder.svg?height=200&width=300",
    description: "Step into a smoky jazz cafe with this collection of swing and bebop classics.",
    arrangements: 3,
    rating: 4.6,
  },
  {
    id: 9,
    title: "Mythology",
    year: "2022",
    difficulty: "Advanced",
    duration: "12:30",
    tags: ["Epic", "Orchestral", "Storytelling", "Competition"],
    thumbnail: "/placeholder.svg?height=200&width=300",
    description: "Ancient myths come alive through powerful orchestral arrangements and dramatic drill.",
    arrangements: 5,
    rating: 4.9,
  }
]

const allTags = Array.from(new Set(shows.flatMap((show) => show.tags)))

export default function ShowsPage() {
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

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-bright-dark font-primary">
            Our Show Catalog
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Explore our complete collection of award-winning marching band shows, each crafted with precision and creativity to elevate your performance.
          </p>
        </div>
      </section>

      {/* Show Catalog */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          {/* Filters */}
          <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="Search shows..." className="pl-10 w-64" />
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
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              className="border-bright-secondary text-bright-dark hover:bg-bright-primary/10 bg-transparent"
            >
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>

          {/* Tags */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-bright-dark">Filter by Style:</h3>
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

          {/* Show Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {shows.map((show) => (
              <Card
                key={show.id}
                className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1 bg-white/80 backdrop-blur-sm"
              >
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={show.thumbnail || "/placeholder.svg"}
                    alt={show.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Button
                    size="sm"
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 text-gray-900 hover:bg-white"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <div className="absolute top-4 right-4 flex items-center space-x-1 bg-white/90 rounded-full px-2 py-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-xs font-medium">{show.rating}</span>
                  </div>
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl group-hover:text-bright-third transition-colors font-primary">
                      {show.title}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {show.year}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">{show.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {show.difficulty}
                    </span>
                    <span>{show.duration}</span>
                    <span>{show.arrangements} arrangements</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {show.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {show.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{show.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                  <Link href={`/shows/${show.id}`}>
                    <Button className="w-full bg-bright-primary hover:bg-bright-primary/90 text-bright-dark font-medium">
                      View Details
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-bright-third">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h2 className="text-4xl font-bold mb-6 font-primary">Can't Find What You're Looking For?</h2>
            <p className="text-xl mb-8 opacity-90">
              We specialize in custom show creation. Let's work together to design the perfect show for your band.
            </p>
            <Link href="/contact">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-bright-dark hover:bg-gray-100 text-lg px-8 py-6 font-medium"
              >
                Request Custom Show
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}