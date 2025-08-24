
import { ArrowLeft, Users, Award, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Testimonials from "@/components/features/testimonials"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center mb-6">
          <Button className="btn-ghost" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Page Header */}
        <section className="py-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-bright-dark font-primary">About Bright Designs</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            For over 25 years, we&apos;ve been crafting extraordinary marching band experiences through innovative design,
            custom arrangements, and student-centered approach to musical education.
          </p>
        </section>

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
                <p className="text-gray-600 text-center">
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
                <p className="text-gray-600 text-center">
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
                <p className="text-gray-600 text-center">
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
            <h2 className="text-3xl font-bold mb-8 text-bright-dark font-primary text-center">Our Story</h2>
            <div className="prose prose-lg mx-auto text-gray-600">
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
          <h2 className="text-3xl font-bold mb-12 text-bright-dark font-primary text-center">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Team members would go here */}
            <Card className="frame-card text-center">
              <CardContent className="p-6">
                <div className="w-24 h-24 bg-bright-primary/10 rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-bold mb-2 font-primary">Team Member</h3>
                <p className="text-bright-third mb-2">Founder &amp; Lead Arranger</p>
                <p className="text-gray-600 text-sm">Bio and experience information would go here.</p>
              </CardContent>
            </Card>
            {/* More team members... */}
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 bg-bright-third/5 rounded-2xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-bright-dark font-primary">By the Numbers</h2>
            <p className="text-xl text-gray-600">Our impact on marching band education</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
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
        </section>

        {/* Testimonials */}
        <Testimonials />
      </div>
    </div>
  )
}