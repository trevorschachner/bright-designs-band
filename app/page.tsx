import {
  ArrowRight,
  Play,
  Music,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import Link from "next/link"
import MarchingFormation from "@/components/features/marching-formation"
import Testimonials from "@/components/features/testimonials"
import { db } from "@/lib/database"
import { shows, showsToTags, tags } from "@/lib/database/schema"


import { JsonLd } from "@/components/features/seo/JsonLd"
import { marchingBandSchemas, createFAQSchema } from "@/lib/seo/structured-data"

export default async function HomePage() {
  // Use relational query syntax to avoid problematic imports
  const featuredShows = await db.query.shows.findMany({
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

      {/* Hero Section */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-bright-dark font-primary leading-tight">
              Custom Marching Band
              <br />
              <span className="text-bright-third">Show Design</span>
              <br />
              & Arrangements
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Award-winning marching band show design services. Professional arrangements, innovative drill design, and complete show packages that captivate audiences and elevate your band&apos;s performance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button className="btn-primary btn-lg" asChild>
                <Link href="/build">
                  Build Your Show
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button className="btn-secondary btn-lg" asChild>
                <Link href="/contact">
                  Let&apos;s Talk
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button className="btn-outline btn-lg" asChild>
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
            {featuredShows.map((show) => (
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
                    <Badge className="text-xs">
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
                    {show.showsToTags.map((st: any) => (
                      <Badge key={st.tag.id} className="text-xs">
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
            <Button className="btn-outline btn-lg" asChild>
              <Link href="/shows">
                View All Shows
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <Testimonials />

      {/* Process Section */}
      <section id="process" className="py-20 px-4 bg-gradient-to-br from-white to-slate-50 relative">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-4xl font-bold text-center mb-12 text-bright-dark font-primary">Our Design Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-md text-center">
              <h3 className="text-2xl font-semibold mb-2 font-primary">1. Consultation</h3>
              <p className="text-gray-600">We start by understanding your goals, ensemble strengths, and creative vision.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md text-center">
              <h3 className="text-2xl font-semibold mb-2 font-primary">2. Composition & Arrangement</h3>
              <p className="text-gray-600">Our team crafts engaging music and drill tailored to your ensemble's needs.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md text-center">
              <h3 className="text-2xl font-semibold mb-2 font-primary">3. Delivery & Support</h3>
              <p className="text-gray-600">We provide rehearsal resources and remain available for feedback throughout the season.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-4 bg-white relative">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-4xl font-bold text-center mb-12 text-bright-dark font-primary">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-md text-center">
              <h3 className="text-xl font-semibold mb-2 font-primary">Custom Shows</h3>
              <p className="text-gray-600">Complete show design built from the ground up to match your band's personality.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md text-center">
              <h3 className="text-xl font-semibold mb-2 font-primary">Arrangements</h3>
              <p className="text-gray-600">Professional music arrangements that highlight your ensemble's unique sound.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md text-center">
              <h3 className="text-xl font-semibold mb-2 font-primary">Consultation</h3>
              <p className="text-gray-600">Expert advice on show concepts, rehearsal strategies, and adjudication preparedness.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md text-center">
              <h3 className="text-xl font-semibold mb-2 font-primary">Music Licensing</h3>
              <p className="text-gray-600">Hassle-free licensing assistance to keep your performances compliant.</p>
            </div>
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
              <Button className="btn-secondary btn-lg" asChild>
                <Link href="/build">
                  Start Your Project
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button className="btn-outline btn-lg" asChild>
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

      {/* Structured Data for SEO */}
      <JsonLd data={marchingBandSchemas.showDesignService} />
      <JsonLd data={marchingBandSchemas.arrangementService} />
      <JsonLd data={marchingBandSchemas.drillService} />
      
      {/* FAQ Schema for common questions */}
      <JsonLd data={createFAQSchema([
        {
          question: "What services does Bright Designs offer for marching bands?",
          answer: "Bright Designs offers complete marching band show design services including custom music arrangements, drill writing, choreography design, and full show packages for competitive and exhibition programs."
        },
        {
          question: "How long does it take to create a custom marching band show?",
          answer: "Custom marching band show creation typically takes 6-12 weeks depending on the complexity of the arrangement, drill design requirements, and show length. We work closely with directors to meet performance deadlines."
        },
        {
          question: "Do you work with high school and college marching bands?",
          answer: "Yes, Bright Designs works with marching bands at all levels including high school, college, and competitive independent ensembles. We tailor our designs to match the skill level and goals of each group."
        },
        {
          question: "Can you arrange existing songs for marching band?",
          answer: "Absolutely! We specialize in creating custom marching band arrangements of popular songs, classical pieces, and original compositions. All arrangements are optimized for marching band instrumentation and field performance."
        }
      ])} />
    </div>
  );
}