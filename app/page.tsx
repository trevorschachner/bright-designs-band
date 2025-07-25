import { ArrowRight, Filter, Play, Music, Users, Star, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import MarchingFormation from "./components/marching-formation"

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
]

const allTags = Array.from(new Set(shows.flatMap((show) => show.tags)))

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 relative">
      <MarchingFormation />

      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 relative">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-bright-primary rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-bright-dark" />
              </div>
              <span className="text-xl font-bold text-bright-dark font-primary">Bright Designs</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/shows" className="text-gray-600 hover:text-bright-third transition-colors">
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
              <Link href="/contact">
                <Button className="bg-bright-primary hover:bg-bright-primary/90 text-bright-dark font-medium">
                  Build Your Show
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-bright-dark font-primary leading-tight">
              Craft Extraordinary
              <br />
              Marching Band Shows
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              From concept to competition, we create innovative arrangements and complete show designs that captivate
              audiences and elevate performances.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/contact">
                <Button
                  size="lg"
                  className="bg-bright-primary hover:bg-bright-primary/90 text-bright-dark text-lg px-8 py-6 font-medium"
                >
                  Build Your Show
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/shows">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-bright-secondary text-bright-dark hover:bg-bright-primary/10 text-lg px-8 py-6 bg-transparent"
                >
                  View Our Work
                  <Play className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-white/50 backdrop-blur-sm relative">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-bright-third mb-2 font-primary">150+</div>
              <div className="text-gray-600">Shows Created</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-bright-primary mb-2 font-primary">500+</div>
              <div className="text-gray-600">Arrangements</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-bright-dark mb-2 font-primary">50+</div>
              <div className="text-gray-600">Schools Served</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-bright-third mb-2 font-primary">98%</div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 bg-white/50 relative">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8 text-bright-dark font-primary">About Bright Designs</h2>
          <div className="max-w-4xl mx-auto">
            <p className="text-xl text-gray-600 mb-12">
              We are passionate creators dedicated to transforming marching band performances through innovative design, 
              exceptional arrangements, and comprehensive show development.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-bright-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-bright-dark" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-primary">Excellence</h3>
                <p className="text-gray-600">We strive for perfection in every arrangement and show design we create.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-bright-third rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-primary">Collaboration</h3>
                <p className="text-gray-600">We work closely with directors to ensure every show reflects their vision.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-bright-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Music className="w-8 h-8 text-bright-dark" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-primary">Innovation</h3>
                <p className="text-gray-600">We push boundaries to create truly unique and memorable performances.</p>
              </div>
            </div>
            <Link href="/about">
              <Button 
                size="lg"
                variant="outline"
                className="border-bright-secondary text-bright-dark hover:bg-bright-primary/10"
              >
                Learn More About Us
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-20 px-4 relative">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-bright-dark font-primary">Our Creative Process</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From initial concept to final performance, we guide you through every step of creating an extraordinary marching band show.
            </p>
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-bright-primary rounded-full flex items-center justify-center mx-auto mb-6 text-bright-dark font-bold text-2xl">
                  1
                </div>
                <h3 className="text-xl font-bold mb-4 font-primary">Discovery</h3>
                <p className="text-gray-600">We learn about your band, goals, and vision for the perfect show.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-bright-third rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-2xl">
                  2
                </div>
                <h3 className="text-xl font-bold mb-4 font-primary">Concept</h3>
                <p className="text-gray-600">Together, we develop a compelling theme and musical direction.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-bright-secondary rounded-full flex items-center justify-center mx-auto mb-6 text-bright-dark font-bold text-2xl">
                  3
                </div>
                <h3 className="text-xl font-bold mb-4 font-primary">Creation</h3>
                <p className="text-gray-600">Our experts craft arrangements and design visual elements.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-bright-primary rounded-full flex items-center justify-center mx-auto mb-6 text-bright-dark font-bold text-2xl">
                  4
                </div>
                <h3 className="text-xl font-bold mb-4 font-primary">Delivery</h3>
                <p className="text-gray-600">We deliver your complete show package and provide ongoing support.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Show Catalog */}
      <section id="shows" className="py-20 px-4 relative">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-bright-dark font-primary">Our Show Catalog</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore our collection of award-winning shows, each crafted with precision and creativity.
            </p>
          </div>

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
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-bright-third relative">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h2 className="text-4xl font-bold mb-6 font-primary">Ready to Create Something Amazing?</h2>
            <p className="text-xl mb-8 opacity-90">
              Let's collaborate to bring your vision to life. From custom arrangements to complete show design, we're
              here to help your band shine.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-bright-dark hover:bg-gray-100 text-lg px-8 py-6 font-medium"
                >
                  Start Your Project
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 text-lg px-8 py-6 bg-transparent"
                >
                  Schedule Consultation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 relative">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-bright-primary rounded-lg flex items-center justify-center">
                  <Music className="w-5 h-5 text-bright-dark" />
                </div>
                <span className="text-xl font-bold font-primary">Bright Designs</span>
              </div>
              <p className="text-gray-400">
                Crafting extraordinary marching band experiences through innovative design and arrangement.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 font-primary">Services</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/shows" className="hover:text-white transition-colors">
                    Custom Shows
                  </Link>
                </li>
                <li>
                  <Link href="/arrangements" className="hover:text-white transition-colors">
                    Arrangements
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Consultation
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Music Licensing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 font-primary">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/shows" className="hover:text-white transition-colors">
                    Show Catalog
                  </Link>
                </li>
                <li>
                  <Link href="/arrangements" className="hover:text-white transition-colors">
                    Sample Audio
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibbold mb-4 font-primary">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li>hello@brightdesigns.band</li>
                <li>(555) 123-4567</li>
                <li>Austin, TX</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Bright Designs. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
