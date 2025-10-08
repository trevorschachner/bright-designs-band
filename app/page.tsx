import {
  ArrowRight,
  Play,
  Music,
  Users,
  MessageSquare,
  Lightbulb,
  FileText,
  PenTool,
  CheckCircle,
  Headphones,
  Palette,
  Eye,
  Calendar,
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
      <section className="plus-section bg-background">
        <div className="plus-container text-center">
          <div className="plus-content">
            <h1 className="plus-h1 mb-6">
              Student. Centered. Design.
            </h1>
            <p className="plus-body-lg mb-12 max-w-2xl mx-auto">
              Championship-caliber design that captivates audiences and judges alike.
              <br />
              Over 100+ shows performed across the country.
            </p>
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

      {/* Testimonials Section */}
      <Testimonials />

      {/* Process Section - Timeline Design */}
      <section id="process" className="plus-section bg-background">
        <div className="plus-container">
          <div className="text-center mb-20">
            <h2 className="plus-h2 mb-4">Our Design Process</h2>
            <p className="plus-body-lg max-w-2xl mx-auto">
              A proven, collaborative approach to creating championship-caliber shows
            </p>
          </div>
          
          {/* Desktop Timeline - Alternating Layout */}
          <div className="hidden lg:block relative">
            {/* Timeline Line */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-border" />
            
            <div className="space-y-24">
              {/* Step 1 - Left */}
              <div className="relative grid grid-cols-2 gap-8 items-center">
                <div className="text-right pr-12">
                  <div className="inline-block plus-surface-elevated p-6 hover:shadow-md transition-shadow">
                    <h3 className="plus-h3 mb-3 flex items-center justify-end gap-3">
                      Consultation
                      <MessageSquare className="w-6 h-6 text-primary" />
                    </h3>
                    <p className="plus-body-sm">
                      We start by understanding your goals, ensemble strengths, and long-term vision for your program.
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg z-10">
                    1
                  </div>
                </div>
              </div>

              {/* Step 2 - Right */}
              <div className="relative grid grid-cols-2 gap-8 items-center">
                <div className="flex items-center justify-end">
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg z-10">
                    2
                  </div>
                </div>
                <div className="pl-12">
                  <div className="inline-block plus-surface-elevated p-6 hover:shadow-md transition-shadow">
                    <h3 className="plus-h3 mb-3 flex items-center gap-3">
                      <Lightbulb className="w-6 h-6 text-primary" />
                      Design Concepts
                    </h3>
                    <p className="plus-body-sm">
                      Our team develops multiple creative concepts tailored to your ensemble's unique strengths and competitive goals.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 - Left */}
              <div className="relative grid grid-cols-2 gap-8 items-center">
                <div className="text-right pr-12">
                  <div className="inline-block plus-surface-elevated p-6 hover:shadow-md transition-shadow">
                    <h3 className="plus-h3 mb-3 flex items-center justify-end gap-3">
                      Contracts
                      <FileText className="w-6 h-6 text-primary" />
                    </h3>
                    <p className="plus-body-sm">
                      Clear agreements and timelines ensure everyone is aligned and expectations are set for a smooth collaboration.
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg z-10">
                    3
                  </div>
                </div>
              </div>

              {/* Step 4 - Right */}
              <div className="relative grid grid-cols-2 gap-8 items-center">
                <div className="flex items-center justify-end">
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg z-10">
                    4
                  </div>
                </div>
                <div className="pl-12">
                  <div className="inline-block plus-surface-elevated p-6 hover:shadow-md transition-shadow">
                    <h3 className="plus-h3 mb-3 flex items-center gap-3">
                      <PenTool className="w-6 h-6 text-primary" />
                      Drafts
                    </h3>
                    <p className="plus-body-sm">
                      Regular draft deliveries with opportunities for feedback ensure the show evolves to meet your vision.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 5 - Left */}
              <div className="relative grid grid-cols-2 gap-8 items-center">
                <div className="text-right pr-12">
                  <div className="inline-block plus-surface-elevated p-6 hover:shadow-md transition-shadow">
                    <h3 className="plus-h3 mb-3 flex items-center justify-end gap-3">
                      Completion
                      <CheckCircle className="w-6 h-6 text-primary" />
                    </h3>
                    <p className="plus-body-sm">
                      Final delivery of all materials, rehearsal resources, and documentation to prepare your ensemble for success.
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg z-10">
                    5
                  </div>
                </div>
              </div>

              {/* Step 6 - Right */}
              <div className="relative grid grid-cols-2 gap-8 items-center">
                <div className="flex items-center justify-end">
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg z-10">
                    6
                  </div>
                </div>
                <div className="pl-12">
                  <div className="inline-block plus-surface-elevated p-6 hover:shadow-md transition-shadow">
                    <h3 className="plus-h3 mb-3 flex items-center gap-3">
                      <Headphones className="w-6 h-6 text-primary" />
                      Support
                    </h3>
                    <p className="plus-body-sm">
                      Ongoing support throughout your season—we're here to help with questions, adjustments, and guidance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Timeline - Vertical Layout */}
          <div className="lg:hidden relative pl-8">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            
            <div className="space-y-12">
              {/* Step 1 */}
              <div className="relative">
                <div className="absolute -left-8 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg">
                  1
                </div>
                <div className="plus-surface-elevated p-6">
                  <h3 className="plus-h3 mb-3 flex items-center gap-3">
                    <MessageSquare className="w-6 h-6 text-primary" />
                    Consultation
                  </h3>
                  <p className="plus-body-sm">
                    We start by understanding your goals, ensemble strengths, and long-term vision for your program.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="absolute -left-8 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg">
                  2
                </div>
                <div className="plus-surface-elevated p-6">
                  <h3 className="plus-h3 mb-3 flex items-center gap-3">
                    <Lightbulb className="w-6 h-6 text-primary" />
                    Design Concepts
                  </h3>
                  <p className="plus-body-sm">
                    Our team develops multiple creative concepts tailored to your ensemble's unique strengths and competitive goals.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="absolute -left-8 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg">
                  3
                </div>
                <div className="plus-surface-elevated p-6">
                  <h3 className="plus-h3 mb-3 flex items-center gap-3">
                    <FileText className="w-6 h-6 text-primary" />
                    Contracts
                  </h3>
                  <p className="plus-body-sm">
                    Clear agreements and timelines ensure everyone is aligned and expectations are set for a smooth collaboration.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative">
                <div className="absolute -left-8 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg">
                  4
                </div>
                <div className="plus-surface-elevated p-6">
                  <h3 className="plus-h3 mb-3 flex items-center gap-3">
                    <PenTool className="w-6 h-6 text-primary" />
                    Drafts
                  </h3>
                  <p className="plus-body-sm">
                    Regular draft deliveries with opportunities for feedback ensure the show evolves to meet your vision.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="relative">
                <div className="absolute -left-8 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg">
                  5
                </div>
                <div className="plus-surface-elevated p-6">
                  <h3 className="plus-h3 mb-3 flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-primary" />
                    Completion
                  </h3>
                  <p className="plus-body-sm">
                    Final delivery of all materials, rehearsal resources, and documentation to prepare your ensemble for success.
                  </p>
                </div>
              </div>

              {/* Step 6 */}
              <div className="relative">
                <div className="absolute -left-8 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg">
                  6
                </div>
                <div className="plus-surface-elevated p-6">
                  <h3 className="plus-h3 mb-3 flex items-center gap-3">
                    <Headphones className="w-6 h-6 text-primary" />
                    Support
                  </h3>
                  <p className="plus-body-sm">
                    Ongoing support throughout your season—we're here to help with questions, adjustments, and guidance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="plus-section bg-muted/30">
        <div className="plus-container">
          <div className="text-center mb-20">
            <h2 className="plus-h2 mb-4">Our Services</h2>
            <p className="plus-body-lg max-w-2xl mx-auto">
              Comprehensive design solutions tailored to your ensemble's unique needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Custom Show Design */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Music className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="plus-h3">Custom Show Design</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="plus-body-sm">
                  Complete show design specifically crafted for BOA regional and national competition success. Championship-caliber productions that captivate audiences and judges.
                </p>
              </CardContent>
            </Card>

            {/* Music Design */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Music className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="plus-h3">Music Design</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="plus-body-sm">
                  Pre-written and custom wind, percussion, and sound design for groups of all skill levels. Engaging arrangements that showcase your ensemble's strengths.
                </p>
              </CardContent>
            </Card>

            {/* Visual Design */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Eye className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="plus-h3">Visual Design</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="plus-body-sm">
                  Visual design, wind choreography, and guard choreography that will make your band shine. Dynamic movement that brings your show to life.
                </p>
              </CardContent>
            </Card>

            {/* Program Coordination */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="plus-h3">Program Coordination</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="plus-body-sm">
                  Creative programming, comprehensive design elements, and professional project management. One point of contact for all your needs from day one until the end of the season.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" asChild>
              <Link href="/services">
                Explore All Services
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