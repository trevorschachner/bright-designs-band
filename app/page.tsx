import { ArrowRight, Play, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ServicesGrid, { ServiceItem } from "@/components/features/services/services-grid"
import Testimonials from "@/components/features/testimonials"
import { JsonLd } from "@/components/features/seo/JsonLd"
import PageHero from "@/components/layout/page-hero"

import Link from "next/link"
// Using the API envelope shape without importing types to avoid server/type coupling


import { marchingBandSchemas, createFAQSchema } from "@/lib/seo/structured-data"

// Force dynamic rendering to prevent build-time database connection issues
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Trust Supabase-backed API for shape and schema
  let featuredShows: any[] = [];
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    const res = await fetch(`${baseUrl}/api/shows?featured=true&limit=6`, { cache: 'no-store' });
    const json = await res.json() as any;
    const data = json?.data?.data || [];
    featuredShows = data.map((s: any) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      year: s.year,
      difficulty: s.difficulty,
      duration: s.duration,
      thumbnailUrl: s.thumbnailUrl || null,
      graphicUrl: s.graphicUrl || null,
      createdAt: s.createdAt || s.created_at,
      showsToTags: s.showsToTags || [],
    }));
    // Fallback: if no featured shows are flagged, load latest shows
    if (featuredShows.length === 0) {
      const res2 = await fetch(`${baseUrl}/api/shows?limit=6`, { cache: 'no-store' });
      const json2 = await res2.json() as any;
      const data2 = json2?.data?.data || [];
      featuredShows = data2.map((s: any) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        year: s.year,
        difficulty: s.difficulty,
        duration: s.duration,
        thumbnailUrl: s.thumbnailUrl || null,
        graphicUrl: s.graphicUrl || null,
        createdAt: s.createdAt || s.created_at,
        showsToTags: s.showsToTags || [],
      }));
    }
  } catch (error) {
    console.error('Error fetching shows:', error);
    featuredShows = [];
  }
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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <PageHero
        title="Student centered marching band design."
        subtitle={
          "We design shows that help students shine. 100+ championship-caliber shows performed nationwide, each one perfectly suited to performer ability."
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
              <div className="text-4xl sm:text-5xl font-heading font-bold tracking-tight text-foreground mb-3">10+</div>
              <div className="text-sm sm:text-base text-muted-foreground font-medium">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-heading font-bold tracking-tight text-foreground mb-3">50+</div>
              <div className="text-sm sm:text-base text-muted-foreground font-medium">Ensembles Served</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-heading font-bold tracking-tight text-foreground mb-3">100+</div>
              <div className="text-sm sm:text-base text-muted-foreground font-medium">Custom Shows</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-heading font-bold tracking-tight text-foreground mb-3">250+</div>
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

      {/* Show Catalog Preview */}
      <section id="shows" className="plus-section bg-background">
        <div className="plus-container">
          <div className="text-center mb-16">
            <h2 className="plus-h2 mb-4">Featured Shows</h2>
            <p className="plus-body-lg max-w-2xl mx-auto">
              Explore our collection of award-winning shows.
            </p>
          </div>

          {/* Show Grid - Featured Shows Only */}
          {featuredShows.length > 0 ? (
            <div className="plus-grid-3">
              {featuredShows.map((show: any) => (
              <Card key={show.id}>
                <div className="plus-divider mb-4 pb-4">
                  <div className="w-full aspect-video plus-border rounded-lg overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={show.graphicUrl || show.thumbnailUrl || "/placeholder.svg"}
                      alt={show.title}
                      className="w-full h-full object-cover"
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
                    {show.showsToTags.map((st: any) => (
                      <span key={st.tag.id} className="plus-surface px-2 py-1 plus-caption">
                        {st.tag.name}
                      </span>
                    ))}
                  </div>
                  <Button className="w-full" asChild>
                    <Link href={`/shows/${show.slug ?? show.id}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          ) : (
            <div className="text-center py-12">
              <p className="plus-body-lg text-muted-foreground mb-6">Featured shows are temporarily unavailable.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-lg border border-border p-6 animate-pulse">
                    <div className="h-40 bg-muted rounded mb-4" />
                    <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/3" />
                  </div>
                ))}
              </div>
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

      {/* Testimonials Section */}
      <Testimonials />

      {/* Structured Data for SEO */}
      <JsonLd data={marchingBandSchemas.showDesignService} />
      <JsonLd data={marchingBandSchemas.arrangementService} />
      <JsonLd data={marchingBandSchemas.drillService} />
      <JsonLd data={marchingBandSchemas.programCoordination} />
      
      {/* FAQ Schema targeting customer pain points */}
      <JsonLd data={createFAQSchema([
        {
          question: "How do you ensure music is delivered on time?",
          answer: "We guarantee on-time delivery with our structured timeline system. You'll receive regular progress updates, drafts along the way, and we maintain clear communication throughout the entire design process to eliminate delays."
        },
        {
          question: "What makes Bright Designs different from other marching band design companies?",
          answer: "We specialize in serving state finalists and BOA competitive bands. Our expertise is with bands at this skill level. We also offer exceptional communication, and designs tailored specifically for competitive success. No missed deadlines, no communication gaps."
        },
        {
          question: "Do you work with BOA competitive bands and state finalists?",
          answer: "Yes! We specialize in working with competitive programs including BOA regional and national level bands, state finalists, and 3A/4A programs looking to elevate their competitive standing."
        },
        {
          question: "Can you work within our budget and timeline constraints?",
          answer: "Absolutely. We offer flexible design packages and work within your specific budget and performance timeline requirements. We understand the financial constraints of band programs."
        },
        {
          question: "What regions do you serve?",
          answer: "While we work nationally, we specialize in serving the Southeast region including South Carolina, Georgia, and surrounding BOA circuits where we understand the local competitive landscape."
        }
      ])} />
    </div>
  );
}