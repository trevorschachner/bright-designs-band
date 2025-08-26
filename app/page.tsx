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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="plus-section">
        <div className="plus-container text-center">
          <div className="plus-content">
            <h1 className="plus-h1 mb-6">
              Custom Marching Band Show Design & Arrangements
            </h1>
            <p className="plus-body-lg mb-12 max-w-2xl mx-auto">
              Award-winning marching band show design services. Professional arrangements, innovative drill design, and complete show packages that captivate audiences and elevate your band's performance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
              <Button size="lg" asChild>
                <Link href="/build">
                  Build Your Show
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/contact">
                  Let's Talk
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="lg" asChild>
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
      <section className="plus-section plus-divider">
        <div className="plus-container">
          <div className="plus-grid-4 text-center">
            <div className="plus-surface text-center">
              <div className="plus-h2 text-primary mb-2">25+</div>
              <div className="plus-caption">Years Experience</div>
            </div>
            <div className="plus-surface text-center">
              <div className="plus-h2 text-primary mb-2">200+</div>
              <div className="plus-caption">Custom Shows</div>
            </div>
            <div className="plus-surface text-center">
              <div className="plus-h2 text-primary mb-2">100+</div>
              <div className="plus-caption">Schools Served</div>
            </div>
            <div className="plus-surface text-center">
              <div className="plus-h2 text-primary mb-2">1000+</div>
              <div className="plus-caption">Arrangements</div>
            </div>
          </div>
        </div>
      </section>

      {/* Show Catalog Preview */}
      <section id="shows" className="plus-section plus-divider">
        <div className="plus-container">
          <div className="text-center mb-16">
            <h2 className="plus-h2 mb-4">Featured Shows</h2>
            <p className="plus-body-lg max-w-2xl mx-auto">
              Explore our collection of award-winning shows, each crafted with precision and creativity.
            </p>
          </div>

          {/* Show Grid - Featured Shows Only */}
          <div className="plus-grid-3">
            {featuredShows.map((show: any) => (
              <Card key={show.id}>
                <div className="plus-divider mb-4 pb-4">
                  <div className="h-40 plus-border bg-muted flex items-center justify-center rounded-lg">
                    <Play className="w-12 h-12 text-muted-foreground" />
                  </div>
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="plus-h4">
                      {show.title}
                    </CardTitle>
                    <span className="plus-surface px-2 py-1 plus-caption">
                      {show.year}
                    </span>
                  </div>
                  <CardDescription className="plus-body-sm">{show.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4 plus-body-sm">
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      {show.difficulty}
                    </span>
                    <span>{show.duration}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {show.showsToTags.map((st: any) => (
                      <span key={st.tag.id} className="plus-surface px-2 py-1 plus-caption">
                        {st.tag.name}
                      </span>
                    ))}
                  </div>
                  <Button className="w-full" asChild>
                    <Link href={`/shows/${show.id}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" size="lg" asChild>
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
      <section id="process" className="plus-section plus-divider">
        <div className="plus-container plus-content">
          <h2 className="plus-h2 text-center mb-16">Our Design Process</h2>
          <div className="plus-grid-3">
            <div className="plus-card text-center">
              <h3 className="plus-h3 mb-4">1. Consultation</h3>
              <p className="plus-body">We start by understanding your goals, ensemble strengths, and creative vision.</p>
            </div>
            <div className="plus-card text-center">
              <h3 className="plus-h3 mb-4">2. Composition & Arrangement</h3>
              <p className="plus-body">Our team crafts engaging music and drill tailored to your ensemble's needs.</p>
            </div>
            <div className="plus-card text-center">
              <h3 className="plus-h3 mb-4">3. Delivery & Support</h3>
              <p className="plus-body">We provide rehearsal resources and remain available for feedback throughout the season.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="plus-section plus-divider">
        <div className="plus-container plus-content">
          <h2 className="plus-h2 text-center mb-16">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 frame-card text-center">
              <h3 className="text-xl font-semibold mb-2 font-primary">Custom Shows</h3>
              <p className="text-gray-600">Complete show design built from the ground up to match your band&apos;s personality.</p>
            </div>
            <div className="p-6 frame-card text-center">
              <h3 className="text-xl font-semibold mb-2 font-primary">Arrangements</h3>
              <p className="text-gray-600">Professional music arrangements that highlight your ensemble&apos;s unique sound.</p>
            </div>
            <div className="p-6 frame-card text-center">
              <h3 className="text-xl font-semibold mb-2 font-primary">Consultation</h3>
              <p className="text-gray-600">Expert advice on show concepts, rehearsal strategies, and adjudication preparedness.</p>
            </div>
            <div className="p-6 frame-card text-center">
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
              Let&apos;s collaborate to bring your vision to life. From custom arrangements to complete show design, we&apos;re
              here to help your band shine.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="btn-secondary btn-lg" asChild>
                <Link href="/build">
                  Start Your Project
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button className="btn-secondary btn-lg" asChild>
                <Link href="/contact">Schedule Consultation</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

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