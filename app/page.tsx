import {
  ArrowRight,
  Play,
  Music,
  Users,
  Star,
  ChevronDown,
  Monitor,
  Sparkles,
  Target,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import MarchingFormation from "./components/marching-formation"
import { db } from "@/lib/db"

export default async function HomePage() {
  const shows = await db.query.shows.findMany({
    limit: 6,
    with: {
      showsToTags: {
        with: {
          tag: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 relative">
      <MarchingFormation />

      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 relative">
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
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center text-gray-600 hover:text-bright-third transition-colors">
                  Resources
                  <ChevronDown className="ml-1 w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-4">
                  <div className="space-y-4">
                    <Link
                      href="/arrangements"
                      className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-8 h-8 bg-bright-third/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Monitor className="w-4 h-4 text-bright-third" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">All Arrangements</h4>
                        <p className="text-sm text-gray-600">
                          Full catalogue of all our individual arrangements for sale!
                        </p>
                      </div>
                    </Link>
                    <Link
                      href="/faqs"
                      className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-8 h-8 bg-bright-third/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Sparkles className="w-4 h-4 text-bright-third" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">FAQs</h4>
                        <p className="text-sm text-gray-600">Answers to the most common questions from our clients.</p>
                      </div>
                    </Link>
                    <Link
                      href="/guide"
                      className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-8 h-8 bg-bright-third/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Target className="w-4 h-4 text-bright-third" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Free Visual Technique Guide!</h4>
                        <p className="text-sm text-gray-600">Grab a free visual technique guide made by our team!</p>
                      </div>
                    </Link>
                    <Link
                      href="/contact"
                      className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-8 h-8 bg-bright-third/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <MessageCircle className="w-4 h-4 text-bright-third" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Contact Us</h4>
                        <p className="text-sm text-gray-600">Get in touch with us! A REAL person will reach out!</p>
                      </div>
                    </Link>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button className="btn-outline" asChild>
                <Link href="/contact">Contact Us</Link>
              </Button>
              <Button className="btn-primary" asChild>
                <Link href="/build">
                  Build Your Show
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-bright-dark font-primary leading-tight">
              Student
              <br />
              <span className="text-bright-third">centered</span>
              <br />
              design.
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Bringing best in class design to best in class bands.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="btn-primary btn-lg" asChild>
                <Link href="/contact">
                  Let's Talk
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" className="btn-secondary btn-lg" asChild>
                <Link href="/shows">
                  View Our Work
                  <Play className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-white/50 backdrop-blur-sm relative">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-bright-third mb-2 font-primary">25+</div>
              <div className="text-gray-600">Years Experience</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-bright-primary mb-2 font-primary">200+</div>
              <div className="text-gray-600">Custom Shows</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-bright-dark mb-2 font-primary">100+</div>
              <div className="text-gray-600">Schools Served</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-bright-third mb-2 font-primary">1000+</div>
              <div className="text-gray-600">Arrangements</div>
            </div>
          </div>
        </div>
      </section>

      {/* Show Catalog Preview */}
      <section id="shows" className="py-20 px-4 relative">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-bright-dark font-primary">Featured Shows</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore our collection of award-winning shows, each crafted with precision and creativity.
            </p>
          </div>

          {/* Show Grid - Featured Shows Only */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {shows.map((show) => (
              <Card
                key={show.id}
                className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1 bg-white/80 backdrop-blur-sm"
              >
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={show.thumbnailUrl || "/placeholder.svg"}
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
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {show.showsToTags.map((st) => (
                      <Badge key={st.tag.id} variant="secondary" className="text-xs">
                        {st.tag.name}
                      </Badge>
                    ))}
                  </div>
                  <Button className="btn-primary w-full" asChild>
                    <Link href={`/shows/${show.id}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" className="btn-outline btn-lg" asChild>
              <Link href="/shows">
                View All Shows
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
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
              <Button size="lg" className="btn-secondary btn-lg" asChild>
                <Link href="/build">
                  Start Your Project
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" className="btn-outline btn-lg" asChild>
                <Link href="/contact">Schedule Consultation</Link>
              </Button>
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
                    Testimonials
                  </Link>
                </li>
                <li>
                  <Link href="/faqs" className="hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 font-primary">Contact</h3>
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
  );
}
