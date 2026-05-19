import { ArrowRight, Play, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ServicesGrid, { ServiceItem } from "@/components/features/services/services-grid"
import Testimonials from "@/components/features/testimonials"
import { JsonLd } from "@/components/features/seo/JsonLd"
import PageHero from "@/components/layout/page-hero"
import Link from "next/link"
import { marchingBandSchemas, createFAQSchema } from "@/lib/seo/structured-data"
import { getFeaturedShows } from "@/lib/services/shows"

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
              {featuredShows.map((show) => (
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
                    {show.showsToTags.map((st) => (
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

      {/* Structured Data for SEO */}
      <JsonLd data={marchingBandSchemas.showDesignService} />
      <JsonLd data={marchingBandSchemas.arrangementService} />
      <JsonLd data={marchingBandSchemas.drillService} />
      <JsonLd data={marchingBandSchemas.programCoordination} />
      
      <JsonLd data={createFAQSchema([
        {
          question: "How do you ensure music is delivered on time?",
          answer: "We guarantee on-time delivery with our structured timeline system. You'll receive regular progress updates, drafts along the way, and we maintain clear communication throughout the entire design process to eliminate delays."
        },
        {
          question: "What makes Bright Designs different from other marching band design companies?",
          answer: "We specialize in serving state finalists and BOA competitive bands with exceptional communication and designs tailored specifically for competitive success. No missed deadlines, no communication gaps — and we back that with modern engineering that most design companies don't have."
        },
        {
          question: "Do you work with BOA competitive bands and state finalists?",
          answer: "Yes, we specialize in working with competitive programs including BOA regional and national level bands, state finalists, and 3A/4A/5A programs looking to elevate their competitive standing."
        },
        {
          question: "Can you work within our budget and timeline constraints?",
          answer: "Yes. We offer flexible design packages and work within your specific budget and performance timeline. We understand the financial constraints of band programs and offer payment plans."
        },
        {
          question: "What regions do you serve?",
          answer: "We work nationally, but specialize in the Southeast — South Carolina, Georgia, North Carolina, and Florida — where we know the local BOA circuits and competitive landscape deeply."
        },
        {
          question: "How much does a custom marching band show cost?",
          answer: "Custom show design typically ranges from $2,500 to $10,000+ depending on the scope of services — music arrangements, drill writing, visual design, percussion design, and sound design. Pre-written shows are available at lower price points. Contact us for a specific quote based on your program's needs."
        },
        {
          question: "How long does it take to design a custom marching band show?",
          answer: "A full custom show typically takes 8–16 weeks depending on scope and season start date. We recommend starting conversations 4–6 months before your first performance. Rush timelines are available for programs with tighter windows."
        },
        {
          question: "What is included in a custom marching band show package?",
          answer: "A full custom show package includes a custom music arrangement, drill design, visual design concepts, and support throughout the competitive season. Additional services like percussion writing, sound design, and program coordination are available. Every deliverable is provided in print-ready and performance-ready formats."
        },
        {
          question: "What is the difference between a custom show and a pre-written show?",
          answer: "A custom show is designed specifically for your band — your theme, your size, your competitive goals. A pre-written show is an existing design ready for immediate purchase that you can adapt to your instrumentation. Pre-written shows are faster to get and more budget-friendly; custom shows give you a unique production built around your program."
        },
        {
          question: "Can you design a show for a small marching band?",
          answer: "Yes. We design for bands of all sizes, including smaller programs under 40 members. Our pre-written show catalog includes options specifically for small bands, and we can design custom shows scaled to your ensemble."
        },
        {
          question: "When should we start planning our marching band show?",
          answer: "Ideally 4–6 months before your first performance. For fall season competitive bands, that means starting conversations in the winter or early spring. The earlier you start, the more revision cycles we can offer and the more refined the final product."
        },
        {
          question: "What difficulty levels do your shows come in?",
          answer: "Our shows are categorized as Beginner, Intermediate, and Advanced (Grade 5+). We also offer BOA-specific competitive designs for programs aiming at regional and national rankings."
        },
        {
          question: "Do you provide support during the marching season?",
          answer: "Yes. We stay available throughout your season for questions, adjustments, and guidance. We want your show to succeed on the field, not just look good on paper."
        },
        {
          question: "What files and deliverables do we receive?",
          answer: "You receive music in PDF and editable formats, drill in your preferred notation software format, and visual design documentation. All files are yours to use for your program."
        },
        {
          question: "What is BOA and how does show design affect scores?",
          answer: "BOA (Bands of America) is the premier competitive marching band circuit in the United States. Judges score on Music Performance, Music General Effect, Visual Performance, and Visual General Effect. A well-designed show maximizes your score potential across all captions — the design needs to be challenging enough to earn credit but executable enough to be performed cleanly under pressure."
        }
      ])} />
    </div>
  );
}