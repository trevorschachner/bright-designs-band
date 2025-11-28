
import { ArrowLeft, Users, Award, Target, ExternalLink } from "lucide-react"

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
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <PageHero
          title="About Bright Designs"
          subtitle="Serving the marching band community since 2017."
        />

        {/* Mission & Values */}
        <section className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="frame-card">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-bright-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-bright-primary" />
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

            <Card className="frame-card">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-bright-third/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-bright-third" />
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

            <Card className="frame-card">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-bright-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-bright-secondary" />
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
        </section>

        {/* Our Story */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-foreground font-heading text-center">Our Story</h2>
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
        </section>

        {/* Why Us / Beliefs */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-foreground font-heading">Why Bright Designs</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Your program deserves a design partner who actually cares. You&apos;ll get clear world-class design, realistic timelines, all that work for YOUR band.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Belief 1</CardTitle>
                  <CardDescription>A show will never be perfect—great programs iterate, refine, and keep growing.</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Belief 2</CardTitle>
                  <CardDescription>Design must serve students first—clarity, pacing, and achievable demand win seasons.</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Belief 3</CardTitle>
                  <CardDescription>Communication beats chaos—predictable timelines and drafts reduce rehearsal stress.</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Belief 4</CardTitle>
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

        {/* Team Section */}
        <section className="py-16">
          <h2 className="text-3xl font-bold mb-12 text-foreground font-heading text-center">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="frame-card text-center">
              <CardContent className="p-6">
                <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden bg-muted">
                  <img src="/placeholder-user.jpg" alt="Trevor Schachner" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-bold mb-1 font-heading">Trevor Schachner</h3>
                <p className="text-bright-third mb-3">Owner, Educator, Music + Visual Designer</p>
                <p className="text-muted-foreground text-sm">Combines educational focus with championship-caliber design across music and visual, guiding programs with clarity and consistency.</p>
              </CardContent>
            </Card>
            <Card className="frame-card text-center">
              <CardContent className="p-6">
                <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden bg-muted">
                  <img src="/placeholder-user.jpg" alt="Brighton Barrineau" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-bold mb-1 font-heading">Brighton Barrineau</h3>
                <p className="text-bright-third mb-3">Owner, Educator, Music + Visual Designer</p>
                <p className="text-muted-foreground text-sm">Designs cohesive productions that put students first and align pacing and effect for competitive success.</p>
              </CardContent>
            </Card>
            <Card className="frame-card text-center">
              <CardContent className="p-6">
                <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden bg-muted">
                  <img src="/placeholder-user.jpg" alt="Ryan Wilhite" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-bold mb-1 font-heading">Ryan Wilhite</h3>
                <p className="text-bright-third mb-3">Owner, Educator, Program Coordinator</p>
                <p className="text-muted-foreground text-sm">Leads program coordination with clear timelines and communication, ensuring delivery and alignment across the season.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 bg-muted/30 rounded-2xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground font-heading">By the Numbers</h2>
            <p className="text-xl text-muted-foreground">Our impact on marching band education</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-heading font-bold text-bright-third mb-2">10+</div>
              <div className="text-muted-foreground">Years Experience</div>
            </div>
            <div>
              <div className="text-4xl font-heading font-bold text-bright-primary mb-2">50+</div>
              <div className="text-muted-foreground">Custom Shows</div>
            </div>
            <div>
              <div className="text-4xl font-heading font-bold text-foreground mb-2">50+</div>
              <div className="text-muted-foreground">Schools Served</div>
            </div>
            <div>
              <div className="text-4xl font-heading font-bold text-bright-third mb-2">250+</div>
              <div className="text-muted-foreground">Arrangements</div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <Testimonials />

        {/* Our Collaborators Section */}
        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground font-heading">Our Colleagues</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Talented professionals and partners we work with to create the best possible shows for your program.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-foreground font-heading">Nicole Davis</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="italic text-bright-third">Visual Design, Choreography</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-foreground font-heading">Shane Barnes</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="italic text-bright-third">Visual Design, Choreography</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-foreground font-heading">Hunter Dugie</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="italic text-bright-third">Visual Design, Program Coordination</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-foreground font-heading">Richard Hinshaw</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="italic text-bright-third">Visual Design</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-foreground font-heading">Bradley Klemmensen</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="italic text-bright-third">Visual Design</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-foreground font-heading">Aaron Stickley</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="italic text-bright-third">Visual Design</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-foreground font-heading">Ben Stone</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="italic text-bright-third">Visual Design</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-foreground font-heading">Nathan Woods</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="italic text-bright-third">Visual Design</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-foreground font-heading">Eric Kruse</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="italic text-bright-third">Percussion, Sound Design</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-foreground font-heading">Brady Hartness</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="italic text-bright-third">Percussion, Sound Design</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-foreground font-heading">Omar Carmenates</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="italic text-bright-third">Percussion, Sound Design</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-foreground font-heading">Lindsay Vasko</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="italic text-bright-third">Percussion</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-foreground font-heading">Taylor Davis</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="italic text-bright-third">Percussion</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-foreground font-heading">Reed Kimmel</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="italic text-bright-third">Sound Design</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-foreground font-heading">Steven Simmermon</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="italic text-bright-third">Percussion, Sound Design</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-foreground font-heading">Jensen Thomassie</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="italic text-bright-third">Percussion, Sound Design</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-foreground font-heading">Johnathon Jadvani</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="italic text-bright-third">Percussion, Sound Design</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-foreground font-heading">Tom Padgett</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="italic text-bright-third">Color Guard, Choreography</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-foreground font-heading">Markell Allen</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="italic text-bright-third">Graphic Design, Color Guard, Visual Design</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Previous Clients Section */}
        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground font-heading">Previous Clients</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We have proudly served these programs across the country!
            </p>
          </div>
          
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Clients List */}
            <div className="border border-border rounded-lg p-8 bg-muted/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-4">
                {(() => {
                  // Reorganize clients to display alphabetically by column instead of row
                  // CSS Grid flows row-first, so we need to reorganize the array
                  const cols = 4; // Use the largest column count for organization
                  const rows = Math.ceil(clients.length / cols);
                  const columnFirst: typeof clients = [];
                  
                  // Fill column-first: first item of each column, then second item of each column, etc.
                  for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                      const index = col * rows + row;
                      if (index < clients.length) {
                        columnFirst.push(clients[index]);
                      }
                    }
                  }
                  
                  return columnFirst.map((client) => (
                    <div key={`${client.name}-${client.location}`}>
                      <h3 className="font-semibold text-foreground">{client.name}</h3>
                      <p className="text-sm text-muted-foreground">{client.location}</p>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Map Visualization */}
            <div className="mt-8">
              <ClientsMap />
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
