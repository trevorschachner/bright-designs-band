import { ArrowRight, Filter, Play, Music, Download, Star, Search, Clock, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

const arrangements = [
  {
    id: 1,
    title: "Bohemian Rhapsody",
    artist: "Queen",
    genre: "Rock",
    difficulty: "Advanced",
    duration: "5:45",
    price: 89,
    thumbnail: "/placeholder.svg?height=200&width=300",
    description: "A faithful arrangement of Queen's masterpiece, complete with all the dynamic shifts and vocal sections.",
    instrumentation: "Full Band",
    rating: 4.9,
    downloads: 342,
  },
  {
    id: 2,
    title: "September",
    artist: "Earth, Wind & Fire",
    genre: "Funk/Soul",
    difficulty: "Intermediate",
    duration: "3:35",
    price: 65,
    thumbnail: "/placeholder.svg?height=200&width=300",
    description: "Groovy funk arrangement perfect for getting the crowd moving and dancing.",
    instrumentation: "Full Band",
    rating: 4.8,
    downloads: 567,
  },
  {
    id: 3,
    title: "Imperial March",
    artist: "John Williams",
    genre: "Film Score",
    difficulty: "Intermediate",
    duration: "3:02",
    price: 45,
    thumbnail: "/placeholder.svg?height=200&width=300",
    description: "The iconic Darth Vader theme arranged for maximum dramatic impact.",
    instrumentation: "Full Band",
    rating: 4.9,
    downloads: 891,
  },
  {
    id: 4,
    title: "Uptown Funk",
    artist: "Mark Ronson ft. Bruno Mars",
    genre: "Pop/Funk",
    difficulty: "Intermediate",
    duration: "4:30",
    price: 75,
    thumbnail: "/placeholder.svg?height=200&width=300",
    description: "High-energy pop arrangement guaranteed to energize any performance.",
    instrumentation: "Full Band",
    rating: 4.7,
    downloads: 423,
  },
  {
    id: 5,
    title: "Pirates of the Caribbean Medley",
    artist: "Hans Zimmer",
    genre: "Film Score",
    difficulty: "Advanced",
    duration: "6:15",
    price: 95,
    thumbnail: "/placeholder.svg?height=200&width=300",
    description: "Epic medley featuring the most memorable themes from the beloved film series.",
    instrumentation: "Full Band",
    rating: 4.8,
    downloads: 234,
  },
  {
    id: 6,
    title: "Sweet Caroline",
    artist: "Neil Diamond",
    genre: "Pop/Rock",
    difficulty: "Beginner",
    duration: "3:25",
    price: 35,
    thumbnail: "/placeholder.svg?height=200&width=300",
    description: "Crowd-pleasing classic that's perfect for community events and pep rallies.",
    instrumentation: "Full Band",
    rating: 4.6,
    downloads: 678,
  },
  {
    id: 7,
    title: "Thunderstruck",
    artist: "AC/DC",
    genre: "Rock",
    difficulty: "Advanced",
    duration: "4:52",
    price: 85,
    thumbnail: "/placeholder.svg?height=200&width=300",
    description: "High-voltage rock arrangement that showcases the full power of your band.",
    instrumentation: "Full Band",
    rating: 4.9,
    downloads: 312,
  },
  {
    id: 8,
    title: "Can't Stop the Feeling",
    artist: "Justin Timberlake",
    genre: "Pop",
    difficulty: "Intermediate",
    duration: "3:56",
    price: 65,
    thumbnail: "/placeholder.svg?height=200&width=300",
    description: "Feel-good pop hit arranged to spread joy and positive energy.",
    instrumentation: "Full Band",
    rating: 4.5,
    downloads: 445,
  },
]

const allGenres = Array.from(new Set(arrangements.map((arr) => arr.genre)))

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

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-bright-dark font-primary">
            Musical Arrangements
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Professional-quality arrangements ready for immediate download. From pop hits to classical masterpieces, 
            find the perfect music for your marching band.
          </p>
        </div>
      </section>

      {/* Arrangements Catalog */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
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
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {allGenres.map((genre) => (
                    <SelectItem key={genre} value={genre.toLowerCase()}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="under-50">Under $50</SelectItem>
                  <SelectItem value="50-75">$50 - $75</SelectItem>
                  <SelectItem value="75-100">$75 - $100</SelectItem>
                  <SelectItem value="over-100">Over $100</SelectItem>
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

          {/* Genre Tags */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-bright-dark">Browse by Genre:</h3>
            <div className="flex flex-wrap gap-2">
              {allGenres.map((genre) => (
                <Badge
                  key={genre}
                  variant="secondary"
                  className="cursor-pointer hover:bg-bright-primary/10 hover:text-bright-third transition-colors"
                >
                  {genre}
                </Badge>
              ))}
            </div>
          </div>

          {/* Arrangements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {arrangements.map((arrangement) => (
              <Card
                key={arrangement.id}
                className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1 bg-white/80 backdrop-blur-sm"
              >
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={arrangement.thumbnail || "/placeholder.svg"}
                    alt={arrangement.title}
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Button
                    size="sm"
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 text-gray-900 hover:bg-white"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <div className="absolute top-3 right-3 flex items-center space-x-1 bg-white/90 rounded-full px-2 py-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-xs font-medium">{arrangement.rating}</span>
                  </div>
                  <div className="absolute top-3 left-3 bg-bright-primary rounded-full px-2 py-1">
                    <span className="text-xs font-bold text-bright-dark">${arrangement.price}</span>
                  </div>
                </div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg group-hover:text-bright-third transition-colors font-primary line-clamp-1">
                    {arrangement.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    by {arrangement.artist}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex justify-between items-center mb-3 text-xs text-gray-600">
                    <span className="flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {arrangement.difficulty}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {arrangement.duration}
                    </span>
                    <span className="flex items-center">
                      <Download className="w-3 h-3 mr-1" />
                      {arrangement.downloads}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <Badge variant="outline" className="text-xs">
                      {arrangement.genre}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {arrangement.instrumentation}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {arrangement.description}
                  </p>
                  <div className="space-y-2">
                    <Link href={`/arrangements/${arrangement.id}`}>
                      <Button 
                        variant="outline" 
                        className="w-full border-bright-secondary text-bright-dark hover:bg-bright-primary/10 text-sm"
                      >
                        View Details
                      </Button>
                    </Link>
                    <Button className="w-full bg-bright-primary hover:bg-bright-primary/90 text-bright-dark font-medium text-sm">
                      Add to Cart - ${arrangement.price}
                    </Button>
                  </div>
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
            <h2 className="text-4xl font-bold mb-6 font-primary">Need a Custom Arrangement?</h2>
            <p className="text-xl mb-8 opacity-90">
              Can't find the perfect arrangement? We create custom arrangements tailored to your band's unique needs and skill level.
            </p>
            <Link href="/contact">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-bright-dark hover:bg-gray-100 text-lg px-8 py-6 font-medium"
              >
                Request Custom Arrangement
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}