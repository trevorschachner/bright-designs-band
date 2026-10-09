import { ArrowRight, Play, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ServicesGrid, { ServiceItem } from "@/components/features/services/services-grid"
import Testimonials from "@/components/features/testimonials"
import { JsonLd } from "@/components/features/seo/JsonLd"
import PageHero from "@/components/layout/page-hero"
import Link from "next/link"
import Image from "next/image"
import { Metadata } from "next"
import { generateMetadata as buildMetadata, defaultSEOConfig } from "@/lib/seo/metadata"
import { marchingBandSchemas } from "@/lib/seo/structured-data"
import { getFeaturedShows } from "@/lib/services/shows"

export const metadata: Metadata = buildMetadata({ ...defaultSEOConfig, path: "/" })

// Revalidate every hour - service layer also caches for 1 hour
export const revalidate = 3600;

export default async function HomePage() {
  // Fetch cached featured shows from the service layer
  const featuredShows = await getFeaturedShows();

  const homeServices: ServiceItem[] = [
    {
      title: "Custom Show Design",
      description:
        "Complete show design for effective bands in all circuits. From the national BOA stage to elite state competitive regionals, we deliver a full music, visual, and aesthetic production.",
      icon: "music",
    },
    {
      title: "Music Design",
      description:
        "Custom wind, percussion, and sound design for groups of all skill levels. Start from a blank canvas or work from pre-arranged movements to build the show that highlights your ensemble's strengths.",
      icon: "music",
    },
    {
      title: "Visual Design",
      description:
        "Eye-catching packages that bring the field to life. From dynamic drill to effective and accessible choreography, we'll make sure everything connects from start to finish.",
      icon: "eye",
    },
    {
      title: "Program Coordination",
      description:
        "Creative programming, comprehensive design elements, and professional project management. We serve as one point of contact for all your needs from day one until the end of the season.",
      icon: "calendar",
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <PageHero
        title={<>Student centered <span className="text-brand-sky">marching band design.</span></>}
        subtitle={
          "We design marching band shows that help students shine. Over 100+ shows performed nationwide across all competitive circuits."
        }
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
          {/* TODO: Uncomment when Build Your Show is production ready */}
          {/* <Button size="lg" asChild>
            <Link href="/build">
              Build Your Show
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button> */}
          <Button variant="outline" size="lg" asChild>
            <Link href="/contact">
              Let&apos;s Talk
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <Button size="lg" asChild>
            <Link href="/shows">
              View Our Work
              <Play className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </PageHero>

      {/* Stats Section */}
      <section className="py-16 sm:py-20 border-y border-border bg-muted/30">
        <div className="plus-container">
          <div className="grid grid-cols-2 gap-8 sm:gap-12 lg:grid-cols-4 lg:gap-16">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-heading font-bold tracking-tight text-brand-electric mb-3">10+</div>
              <div className="text-sm sm:text-base text-muted-foreground font-medium">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-heading font-bold tracking-tight text-brand-sky mb-3">50+</div>
              <div className="text-sm sm:text-base text-muted-foreground font-medium">Ensembles Served</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-heading font-bold tracking-tight text-brand-turf mb-3">75+</div>
              <div className="text-sm sm:text-base text-muted-foreground font-medium">Custom Shows</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-heading font-bold tracking-tight text-brand-midnight mb-3">250+</div>
              <div className="text-sm sm:text-base text-muted-foreground font-medium">Arrangements</div>
            </div>
          </div>
          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link href="/services#process">See our design process</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <Testimonials />

      {/* Show Catalog Preview */}
      <section id="shows" className="plus-section bg-background">
        <div className="plus-container">
          <div className="text-center mb-16">
            <h2 className="plus-h2 mb-4">Featured Shows</h2>
            <p className="plus-body-lg max-w-2xl mx-auto">
              Explore our collection of award-winning marching band shows.
            </p>
          </div>

          {/* Show Grid - Featured Shows Only */}
          {featuredShows.length > 0 ? (
            <div className="plus-grid-3">
              {featuredShows.map((show, index) => (
              <Card key={show.id}>
                <div className="plus-divider mb-4 pb-4">
                  <div className="w-full aspect-video plus-border rounded-lg overflow-hidden bg-muted relative">
                    <Image
                      src={show.graphicUrl || show.thumbnailUrl || "/placeholder.svg"}
                      alt={show.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      priority={index === 0}
                    />
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
                    {show.showsToTags.map((st) => (
                      <span key={st.tag.id} className="plus-surface px-2 py-1 plus-caption">
                        {st.tag.name}
                      </span>
                    ))}
                  </div>
                  <Button className="w-full" asChild>
                    <Link href={`/shows/${show.slug}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          ) : (
            <div className="text-center py-12">
              <p className="plus-body-lg text-muted-foreground mb-6">No featured shows right now.</p>
              <Button variant="outline" asChild>
                <Link href="/shows">Browse all shows</Link>
              </Button>
            </div>
          )}

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

      {/* Services Section (moved above testimonials) */}
      <ServicesGrid
        heading="Design Services"
        description="Comprehensive design solutions tailored to your ensemble's unique needs"
        items={homeServices}
        cta={{ label: "Explore All Services", href: "/services", iconRight: true }}
      />

      {/* Structured data. The show-design and arrangement service schemas
          live on the /shows and /arrangements layouts; the FAQPage schema lives
          on /faqs, which renders that copy (this page has no FAQ section). */}
      <JsonLd data={[marchingBandSchemas.drillService, marchingBandSchemas.programCoordination]} />
    </div>
  );
}