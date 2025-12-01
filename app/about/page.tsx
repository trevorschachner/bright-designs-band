
import { ArrowLeft, Users, Award, Target, ExternalLink } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import PageHero from "@/components/layout/page-hero"
import Testimonials from "@/components/features/testimonials"
import ClientsMap from "@/components/features/clients-map"
import { clients } from "@/lib/data/clients"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <PageHero
        title={<span className="text-brand-midnight">About Bright Designs</span>}
        subtitle="Serving the marching band community since 2017."
      />

      {/* Mission & Values */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="frame-card border-t-4 border-t-brand-electric">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-brand-electric/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-brand-electric" />
                </div>
                <CardTitle className="font-heading">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">
                  To elevate marching band programs through innovative design and arrangements that inspire both
                  performers and audiences while fostering musical growth and creativity.
                </p>
              </CardContent>
            </Card>

            <Card className="frame-card border-t-4 border-t-brand-sky">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-brand-sky/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-brand-sky" />
                </div>
                <CardTitle className="font-heading">Student-Centered</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">
                  Every arrangement and show design is crafted with students in mind, ensuring appropriate difficulty
                  levels while challenging performers to reach their full potential.
                </p>
              </CardContent>
            </Card>

            <Card className="frame-card border-t-4 border-t-brand-turf">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-brand-turf/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-brand-turf" />
                </div>
                <CardTitle className="font-heading">Excellence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">
                  We maintain the highest standards in musical arrangement, drill design, and customer service, ensuring
                  every project exceeds expectations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-brand-midnight font-heading text-center">Our Story</h2>
            <div className="prose prose-lg mx-auto text-muted-foreground">
              <p className="mb-6">
                Founded in 2017, Bright Designs began as a passion project between 3 friends. We fell inlove with marching band during our days of performing and wanted to bring that same passion to the next generation of performers.
                What started as a small endeavor has grown into a widely trusted name in the marching band community serving over 25 schools each year.
              </p>
              <p className="mb-6">
                Our team has decades of experience in music education, performance, and composition. We understand
                the unique challenges facing band directors and work closely with each program to create shows that are
                both educationally valuable and competitively successful.
              </p>
              <p>
                Today, we continue to push the boundaries of what&apos;s possible in marching band design. We are committed to providing the best possible service to our clients and to the marching band community. 
                We can&apos;t wait to work with you and help your program live up to your vision.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Us / Beliefs */}
      <section className="py-16 bg-muted/30 my-8 rounded-3xl container mx-auto px-4">
        <div className="">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground font-heading">Why Bright Designs</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your program deserves a design partner who actually cares. You&apos;ll get clear world-class design, realistic timelines, all that work for YOUR band.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <Card className="bg-brand-midnight text-white border-none">
              <CardHeader>
                <CardTitle className="font-heading text-brand-electric text-2xl mb-2">Belief 1</CardTitle>
                <CardDescription className="text-gray-300 text-lg">A show will never be perfect—great programs iterate, refine, and keep growing.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-brand-electric text-brand-midnight border-none">
              <CardHeader>
                <CardTitle className="font-heading text-brand-midnight text-2xl mb-2">Belief 2</CardTitle>
                <CardDescription className="text-brand-midnight/80 text-lg font-medium">Design must serve students first—clarity, pacing, and achievable demand win seasons.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-brand-turf text-white border-none">
              <CardHeader>
                <CardTitle className="font-heading text-brand-sky text-2xl mb-2">Belief 3</CardTitle>
                <CardDescription className="text-gray-300 text-lg">Communication beats chaos—predictable timelines and drafts reduce rehearsal stress.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-brand-sky text-brand-midnight border-none">
              <CardHeader>
                <CardTitle className="font-heading text-brand-midnight text-2xl mb-2">Belief 4</CardTitle>
                <CardDescription className="text-brand-midnight/80 text-lg font-medium">Details create outcomes—sound, staging, and effect work together to score.</CardDescription>
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

      {/* Team Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-foreground font-heading text-center">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="frame-card text-center hover:-translate-y-1 transition-transform duration-300 border-t-4 border-t-brand-electric">
              <CardContent className="p-6">
                <div className="w-32 h-32 rounded-full mx-auto mb-6 overflow-hidden border-4 border-brand-electric/20 shadow-lg relative">
                  <Image src="/placeholder-user.jpg" alt="Trevor Schachner" fill className="object-cover" />
                </div>
                <h3 className="text-2xl font-bold mb-1 font-heading text-brand-midnight">Trevor Schachner</h3>
                <p className="text-brand-electric font-medium mb-4 uppercase tracking-wide text-sm">Owner, Educator, Music + Visual Designer</p>
                <p className="text-muted-foreground text-sm leading-relaxed">Combines educational focus with championship-caliber design across music and visual, guiding programs with clarity and consistency.</p>
              </CardContent>
            </Card>
            <Card className="frame-card text-center hover:-translate-y-1 transition-transform duration-300 border-t-4 border-t-brand-sky">
              <CardContent className="p-6">
                <div className="w-32 h-32 rounded-full mx-auto mb-6 overflow-hidden border-4 border-brand-sky/20 shadow-lg relative">
                  <Image src="/placeholder-user.jpg" alt="Brighton Barrineau" fill className="object-cover" />
                </div>
                <h3 className="text-2xl font-bold mb-1 font-heading text-brand-midnight">Brighton Barrineau</h3>
                <p className="text-brand-sky font-medium mb-4 uppercase tracking-wide text-sm">Owner, Educator, Music + Visual Designer</p>
                <p className="text-muted-foreground text-sm leading-relaxed">Designs cohesive productions that put students first and align pacing and effect for competitive success.</p>
              </CardContent>
            </Card>
            <Card className="frame-card text-center hover:-translate-y-1 transition-transform duration-300 border-t-4 border-t-brand-turf">
              <CardContent className="p-6">
                <div className="w-32 h-32 rounded-full mx-auto mb-6 overflow-hidden border-4 border-brand-turf/20 shadow-lg relative">
                  <Image src="/placeholder-user.jpg" alt="Ryan Wilhite" fill className="object-cover" />
                </div>
                <h3 className="text-2xl font-bold mb-1 font-heading text-brand-midnight">Ryan Wilhite</h3>
                <p className="text-brand-turf font-medium mb-4 uppercase tracking-wide text-sm">Owner, Educator, Program Coordinator</p>
                <p className="text-muted-foreground text-sm leading-relaxed">Leads program coordination with clear timelines and communication, ensuring delivery and alignment across the season.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-muted/30 rounded-2xl container mx-auto px-4 my-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-foreground font-heading">By the Numbers</h2>
          <p className="text-xl text-muted-foreground">Our impact on marching band education</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-heading font-bold text-brand-electric mb-2">10+</div>
            <div className="text-muted-foreground">Years Experience</div>
          </div>
          <div>
            <div className="text-4xl font-heading font-bold text-brand-sky mb-2">50+</div>
            <div className="text-muted-foreground">Custom Shows</div>
          </div>
          <div>
            <div className="text-4xl font-heading font-bold text-brand-turf mb-2">50+</div>
            <div className="text-muted-foreground">Schools Served</div>
          </div>
          <div>
            <div className="text-4xl font-heading font-bold text-brand-midnight mb-2">250+</div>
            <div className="text-muted-foreground">Arrangements</div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <div className="py-8" /> {/* Spacer to separate sections visually if needed, but Testimonials has its own padding */}
      <Testimonials />

      {/* Our Collaborators Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground font-heading">Our Colleagues</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Talented professionals and partners we work with to create the best possible shows for your program.
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: "Nicole Davis", role: "Visual Design, Choreography" },
                { name: "Shane Barnes", role: "Visual Design, Choreography" },
                { name: "Hunter Dugie", role: "Visual Design, Program Coordination" },
                { name: "Richard Hinshaw", role: "Visual Design" },
                { name: "Bradley Klemmensen", role: "Visual Design" },
                { name: "Aaron Stickley", role: "Visual Design" },
                { name: "Ben Stone", role: "Visual Design" },
                { name: "Nathan Woods", role: "Visual Design" },
                { name: "Eric Kruse", role: "Percussion, Sound Design" },
                { name: "Brady Hartness", role: "Percussion, Sound Design" },
                { name: "Omar Carmenates", role: "Percussion, Sound Design" },
                { name: "Lindsay Vasko", role: "Percussion" },
                { name: "Taylor Davis", role: "Percussion" },
                { name: "Reed Kimmel", role: "Sound Design" },
                { name: "Steven Simmermon", role: "Percussion, Sound Design" },
                { name: "Jensen Thomassie", role: "Percussion, Sound Design" },
                { name: "Johnathon Jadvani", role: "Percussion, Sound Design" },
                { name: "Tom Padgett", role: "Color Guard, Choreography" },
                { name: "Markell Allen", role: "Graphic Design, Color Guard, Visual Design" }
              ].map((colleague: any, index) => (
                <div 
                  key={index}
                  className="group relative overflow-hidden rounded-xl bg-white border border-border p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-lg group-hover:bg-brand-electric group-hover:text-brand-midnight transition-colors">
                      {colleague.name.charAt(0)}
                    </div>
                    {colleague.link ? (
                      <Link href={colleague.link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ) : null}
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-2 group-hover:text-brand-midnight transition-colors">{colleague.name}</h3>
                  <p className="text-sm text-muted-foreground">{colleague.role}</p>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-brand-electric via-brand-sky to-brand-turf opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
