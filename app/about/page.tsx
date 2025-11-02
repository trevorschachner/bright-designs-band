
import { ArrowLeft, Users, Award, Target, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import PageHero from "@/components/layout/page-hero"
import Testimonials from "@/components/features/testimonials"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <PageHero
          title="About Bright Designs"
          subtitle="For over 25 years, we've been crafting extraordinary marching band experiences through innovative design, custom arrangements, and a student-centered approach to musical education."
        />

        {/* Mission & Values */}
        <section className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="frame-card">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-bright-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-bright-primary" />
                </div>
                <CardTitle className="font-primary">Our Mission</CardTitle>
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
                <CardTitle className="font-primary">Student-Centered</CardTitle>
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
                <CardTitle className="font-primary">Excellence</CardTitle>
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
            <h2 className="text-3xl font-bold mb-8 text-foreground font-primary text-center">Our Story</h2>
            <div className="prose prose-lg mx-auto text-muted-foreground">
              <p className="mb-6">
                Founded in 1999, Bright Designs began as a passion project to bring innovative musical arrangements to
                high school marching bands. What started as a small operation has grown into one of the most respected
                names in marching band design, serving over 100 schools across the country.
              </p>
              <p className="mb-6">
                Our team combines decades of experience in music education, performance, and composition. We understand
                the unique challenges facing band directors and work closely with each program to create shows that are
                both educationally valuable and competitively successful.
              </p>
              <p>
                Today, we continue to push the boundaries of what&apos;s possible in marching band design, incorporating new
                technologies, musical styles, and pedagogical approaches while maintaining our commitment to
                student-centered design and educational excellence.
              </p>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16">
          <h2 className="text-3xl font-bold mb-12 text-foreground font-primary text-center">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Team members would go here */}
            <Card className="frame-card text-center">
              <CardContent className="p-6">
                <div className="w-24 h-24 bg-bright-primary/10 rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-bold mb-2 font-primary">Team Member</h3>
                <p className="text-bright-third mb-2">Founder &amp; Lead Arranger</p>
                <p className="text-muted-foreground text-sm">Bio and experience information would go here.</p>
              </CardContent>
            </Card>
            {/* More team members... */}
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 bg-muted/30 rounded-2xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground font-primary">By the Numbers</h2>
            <p className="text-xl text-muted-foreground">Our impact on marching band education</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-bright-third mb-2 font-primary">25+</div>
              <div className="text-muted-foreground">Years Experience</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-bright-primary mb-2 font-primary">200+</div>
              <div className="text-muted-foreground">Custom Shows</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-foreground mb-2 font-primary">100+</div>
              <div className="text-muted-foreground">Schools Served</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-bright-third mb-2 font-primary">1000+</div>
              <div className="text-muted-foreground">Arrangements</div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <Testimonials />

        {/* Our Friends Section */}
        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground font-primary">Our Friends</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Talented collaborators and partners we work with to create exceptional shows
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Collaborator 1 */}
            <Card className="frame-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2 text-foreground font-primary">Sarah Martinez</h3>
                <p className="text-bright-third text-sm mb-3">Visual Design & Choreography</p>
                <a 
                  href="https://example.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-muted-foreground hover:text-bright-primary transition-colors"
                >
                  Visit Website
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </CardContent>
            </Card>

            {/* Collaborator 2 */}
            <Card className="frame-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2 text-foreground font-primary">Michael Chen</h3>
                <p className="text-bright-third text-sm mb-3">Percussion Arranging</p>
                <a 
                  href="https://example.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-muted-foreground hover:text-bright-primary transition-colors"
                >
                  Visit Website
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </CardContent>
            </Card>

            {/* Collaborator 3 */}
            <Card className="frame-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2 text-foreground font-primary">Emily Johnson</h3>
                <p className="text-bright-third text-sm mb-3">Sound Design & Engineering</p>
                <a 
                  href="https://example.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-muted-foreground hover:text-bright-primary transition-colors"
                >
                  Visit Website
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </CardContent>
            </Card>

            {/* Collaborator 4 */}
            <Card className="frame-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2 text-foreground font-primary">David Thompson</h3>
                <p className="text-bright-third text-sm mb-3">Guard Choreography</p>
                <a 
                  href="https://example.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-muted-foreground hover:text-bright-primary transition-colors"
                >
                  Visit Website
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </CardContent>
            </Card>

            {/* Collaborator 5 */}
            <Card className="frame-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2 text-foreground font-primary">Lisa Rodriguez</h3>
                <p className="text-bright-third text-sm mb-3">Brass Arranging</p>
                <a 
                  href="https://example.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-muted-foreground hover:text-bright-primary transition-colors"
                >
                  Visit Website
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </CardContent>
            </Card>

            {/* Collaborator 6 */}
            <Card className="frame-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2 text-foreground font-primary">James Wilson</h3>
                <p className="text-bright-third text-sm mb-3">Drill Design</p>
                <a 
                  href="https://example.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-muted-foreground hover:text-bright-primary transition-colors"
                >
                  Visit Website
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Previous Clients Section */}
        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground font-primary">Previous Clients</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Proud to have worked with these exceptional programs across the country
            </p>
          </div>
          
          <div className="max-w-7xl mx-auto">
            <div className="max-h-[600px] overflow-y-auto border border-border rounded-lg p-8 bg-muted/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-4">
                {/* Sample schools - replace with actual data */}
                <div>
                  <h3 className="font-semibold text-foreground">Dreher High School</h3>
                  <p className="text-sm text-muted-foreground">Columbia, SC</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Alpharetta High School</h3>
                  <p className="text-sm text-muted-foreground">Alpharetta, GA</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Lexington High School</h3>
                  <p className="text-sm text-muted-foreground">Lexington, SC</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Byrnes High School</h3>
                  <p className="text-sm text-muted-foreground">Duncan, SC</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Northside High School</h3>
                  <p className="text-sm text-muted-foreground">Warner Robins, GA</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Northwest Guilford High School</h3>
                  <p className="text-sm text-muted-foreground">Greensboro, NC</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Mauldin High School</h3>
                  <p className="text-sm text-muted-foreground">Mauldin, SC</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Hillgrove High School</h3>
                  <p className="text-sm text-muted-foreground">Powder Springs, GA</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Riverside High School</h3>
                  <p className="text-sm text-muted-foreground">Greer, SC</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Blythewood High School</h3>
                  <p className="text-sm text-muted-foreground">Blythewood, SC</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Dorman High School</h3>
                  <p className="text-sm text-muted-foreground">Roebuck, SC</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">McEachern High School</h3>
                  <p className="text-sm text-muted-foreground">Powder Springs, GA</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">J.L. Mann High School</h3>
                  <p className="text-sm text-muted-foreground">Greenville, SC</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Etowah High School</h3>
                  <p className="text-sm text-muted-foreground">Woodstock, GA</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Spring Valley High School</h3>
                  <p className="text-sm text-muted-foreground">Columbia, SC</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Grayson High School</h3>
                  <p className="text-sm text-muted-foreground">Loganville, GA</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Fort Mill High School</h3>
                  <p className="text-sm text-muted-foreground">Fort Mill, SC</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Denmark High School</h3>
                  <p className="text-sm text-muted-foreground">Alpharetta, GA</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Westside High School</h3>
                  <p className="text-sm text-muted-foreground">Anderson, SC</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Carrollton High School</h3>
                  <p className="text-sm text-muted-foreground">Carrollton, GA</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Eastside High School</h3>
                  <p className="text-sm text-muted-foreground">Taylors, SC</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Harrison High School</h3>
                  <p className="text-sm text-muted-foreground">Kennesaw, GA</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Rock Hill High School</h3>
                  <p className="text-sm text-muted-foreground">Rock Hill, SC</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Lambert High School</h3>
                  <p className="text-sm text-muted-foreground">Suwanee, GA</p>
                </div>
                {/* Add more schools here - this is just sample data */}
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
