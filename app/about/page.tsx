import { Users, Music, Star, Award, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-bright-primary rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-bright-dark" />
              </div>
              <span className="text-xl font-bold text-bright-dark font-primary">Bright Designs</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/shows" className="text-gray-600 hover:text-bright-third transition-colors">
                Shows
              </Link>
              <Link href="/about" className="text-bright-third font-medium">
                About
              </Link>
              <Link href="/arrangements" className="text-gray-600 hover:text-bright-third transition-colors">
                Arrangements
              </Link>
              <Link href="/contact">
                <Button
                  variant="outline"
                  className="border-bright-secondary text-bright-dark hover:bg-bright-primary/10 bg-transparent"
                >
                  Contact Us
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-bright-dark font-primary">
            About Bright Designs
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            We are passionate creators dedicated to transforming marching band performances through innovative design, 
            exceptional arrangements, and comprehensive show development.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-8 text-bright-dark font-primary text-center">Our Story</h2>
            <div className="prose prose-lg max-w-none text-gray-600">
              <p className="text-xl mb-6">
                Founded with a vision to elevate marching band performances, Bright Designs has been at the forefront 
                of innovative show design and musical arrangement for over a decade.
              </p>
              <p className="mb-6">
                Our team combines deep musical knowledge with cutting-edge design techniques to create shows that 
                not only sound incredible but also tell compelling stories through movement and visual presentation.
              </p>
              <p>
                We believe every marching band has the potential to create something extraordinary. Our role is to 
                help unlock that potential through thoughtful design, expert arrangement, and collaborative creativity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Values */}
      <section className="py-16 px-4 bg-white/50">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-bright-dark font-primary text-center">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <Star className="w-12 h-12 text-bright-primary mx-auto mb-4" />
                <CardTitle className="font-primary">Excellence</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We strive for perfection in every arrangement, every drill design, and every show concept we create.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <Users className="w-12 h-12 text-bright-third mx-auto mb-4" />
                <CardTitle className="font-primary">Collaboration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We work closely with directors and students to ensure every show reflects their unique vision and capabilities.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <Award className="w-12 h-12 text-bright-secondary mx-auto mb-4" />
                <CardTitle className="font-primary">Innovation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We push boundaries and explore new musical territories to create truly unique and memorable performances.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-bright-dark font-primary text-center">Our Process</h2>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-bright-primary rounded-full flex items-center justify-center text-bright-dark font-bold text-xl">
                  1
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3 font-primary">Discovery & Vision</h3>
                  <p className="text-gray-600">
                    We start by understanding your band's unique story, capabilities, and goals for the season.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-bright-third rounded-full flex items-center justify-center text-white font-bold text-xl">
                  2
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3 font-primary">Concept Development</h3>
                  <p className="text-gray-600">
                    Together, we develop a compelling theme and narrative that will guide every aspect of your show.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-bright-secondary rounded-full flex items-center justify-center text-bright-dark font-bold text-xl">
                  3
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3 font-primary">Musical Arrangement</h3>
                  <p className="text-gray-600">
                    Our expert arrangers craft music that showcases your ensemble while serving the show's narrative.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-bright-primary rounded-full flex items-center justify-center text-bright-dark font-bold text-xl">
                  4
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3 font-primary">Visual Design & Drill</h3>
                  <p className="text-gray-600">
                    We design formations and movements that bring the music to life while considering your band's skill level.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-bright-third rounded-full flex items-center justify-center text-white font-bold text-xl">
                  5
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3 font-primary">Support & Refinement</h3>
                  <p className="text-gray-600">
                    We provide ongoing support throughout the season, helping refine and perfect your performance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-bright-third">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h2 className="text-4xl font-bold mb-6 font-primary">Ready to Work Together?</h2>
            <p className="text-xl mb-8 opacity-90">
              Let's create something amazing for your marching band. Get in touch to discuss your vision.
            </p>
            <Link href="/contact">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-bright-dark hover:bg-gray-100 text-lg px-8 py-6 font-medium"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}