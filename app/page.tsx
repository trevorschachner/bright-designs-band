import { ArrowRight, Play, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ServicesGrid, { ServiceItem } from "@/components/features/services/services-grid"
import Testimonials from "@/components/features/testimonials"
import { JsonLd } from "@/components/features/seo/JsonLd"
import PageHero from "@/components/layout/page-hero"

import Link from "next/link"
import { db } from "@/lib/database"
import { shows, showsToTags, tags } from "@/lib/database/schema"
import { desc, inArray, eq } from "drizzle-orm"


import { marchingBandSchemas, createFAQSchema } from "@/lib/seo/structured-data"

export default async function HomePage() {
  // Simpler, robust fetching without nested lateral joins
  const baseShows = await db
    .select()
    .from(shows)
    .orderBy(desc(shows.createdAt))
    .limit(6);

  const showIds = baseShows.map((s: any) => s.id);
  let tagsByShowId: Record<number, any[]> = {};
  if (showIds.length > 0) {
    const tagRows = await db
      .select({
        showId: showsToTags.showId,
        tagId: tags.id,
        tagName: tags.name,
      })
      .from(showsToTags)
      .innerJoin(tags, eq(showsToTags.tagId, tags.id))
      .where(inArray(showsToTags.showId, showIds));

    tagsByShowId = tagRows.reduce((acc: Record<number, any[]>, row) => {
      if (!acc[row.showId]) acc[row.showId] = [];
      acc[row.showId].push({ tag: { id: row.tagId, name: row.tagName } });
      return acc;
    }, {} as Record<number, any[]>);
  }

  const featuredShows = baseShows.map((s: any) => ({
    ...s,
    showsToTags: tagsByShowId[s.id] ?? [],
  }));
  const homeServices: ServiceItem[] = [
    {
      title: "Custom Show Design",
      description:
        "Complete show design specifically crafted for BOA regional and national competition success. Championship-caliber productions that captivate audiences and judges.",
      icon: "music",
    },
    {
      title: "Music Design",
      description:
        "Pre-written and custom wind, percussion, and sound design for groups of all skill levels. Engaging arrangements that showcase your ensemble's strengths.",
      icon: "music",
    },
    {
      title: "Visual Design",
      description:
        "Visual design, wind choreography, and guard choreography that will make your band shine. Dynamic movement that brings your show to life.",
      icon: "eye",
    },
    {
      title: "Program Coordination",
      description:
        "Creative programming, comprehensive design elements, and professional project management. One point of contact for all your needs from day one until the end of the season.",
      icon: "calendar",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <PageHero
        title="Student. Centered. Design."
        subtitle={
          "Championship-caliber design that captivates audiences and judges alike.\nOver 100+ shows performed across the country."
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
              Let's Talk
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

      {/* Why Us / Beliefs */}
      <section className="plus-section bg-muted/30">
        <div className="plus-container">
          <div className="text-center mb-12">
            <h2 className="plus-h2 mb-4">Why Bright Designs</h2>
            <p className="plus-body-lg max-w-2xl mx-auto">
              We’re bought into your program from day one. Clear communication, reliable delivery, and professional design.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="plus-h4">Belief 1</CardTitle>
                <CardDescription>A show will never be perfect—great programs iterate, refine, and keep growing.</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="plus-h4">Belief 2</CardTitle>
                <CardDescription>Design must serve students first—clarity, pacing, and achievable demand win seasons.</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="plus-h4">Belief 3</CardTitle>
                <CardDescription>Communication beats chaos—predictable timelines and drafts reduce rehearsal stress.</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="plus-h4">Belief 4</CardTitle>
                <CardDescription>Details create outcomes—sound, staging, and effect work together to score.</CardDescription>
              </CardHeader>
            </Card>
          </div>
          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link href="/services#process">See our design process</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20 border-y border-border bg-muted/30">
        <div className="plus-container">
          <div className="grid grid-cols-2 gap-8 sm:gap-12 lg:grid-cols-4 lg:gap-16">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-3">10+</div>
              <div className="text-sm sm:text-base text-muted-foreground font-medium">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-3">50+</div>
              <div className="text-sm sm:text-base text-muted-foreground font-medium">Ensembles Served</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-3">100+</div>
              <div className="text-sm sm:text-base text-muted-foreground font-medium">Custom Shows</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-3">250+</div>
              <div className="text-sm sm:text-base text-muted-foreground font-medium">Arrangements</div>
            </div>
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

      {/* Services Section (moved above testimonials) */}
      <ServicesGrid
        heading="Our Services"
        description="Comprehensive design solutions tailored to your ensemble's unique needs"
        items={homeServices}
        cta={{ label: "Explore All Services", href: "/services", iconRight: true }}
      />

      {/* Testimonials Section */}
      <Testimonials />

      {/* CTA Section */}
      <section className="py-20 px-4 bg-bright-third relative">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h2 className="text-4xl font-bold mb-6 font-primary">Ready to Elevate Your Competitive Success?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join the many bands who trust Bright Designs for on-time delivery, exceptional communication, and championship-level show design. No missed deadlines, no communication gaps.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* TODO: Uncomment when Build Your Show is production ready */}
              {/* <Button className="btn-secondary btn-lg" asChild>
                <Link href="/build">
                  Start Your Project
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button> */}
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