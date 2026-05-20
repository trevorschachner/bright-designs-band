import type { Metadata } from 'next'
import { generateMetadata as buildMetadata, pageSEOConfigs } from '@/lib/seo/metadata'
import { MessageSquare, Lightbulb, FileText, PenTool, CheckCircle, Headphones, Music, Eye, Calendar, Users, Play, ArrowRight, Sparkles, Layers, GraduationCap } from "lucide-react"

export const metadata: Metadata = buildMetadata(pageSEOConfigs.services)
import { SpotlightCard } from "@/components/ui/spotlight-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import PageHero from "@/components/layout/page-hero"
import Link from "next/link"

export default function ServicesPage() {
  
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <PageHero
        title={<span className="text-brand-midnight">Our Services</span>}
        subtitle="From full show design packages to standalone consultation and teaching—we provide comprehensive design solutions tailored to your ensemble&apos;s unique needs, competitive goals, and program vision."
      />

      {/* Featured Service: Custom Show Design */}
      <section className="py-16 lg:py-24 bg-brand-midnight text-white relative overflow-hidden my-4 mx-4 rounded-3xl">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-electric rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-sky rounded-full blur-3xl" />
        </div>

        <div className="plus-container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-electric/20 text-brand-electric text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Most Popular
              </div>
              <h2 className="text-4xl lg:text-5xl font-heading font-bold mb-6">Custom Show Design</h2>
              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                Our flagship service. We build a complete production from the ground up, tailored specifically to your students&apos; strengths and your competitive goals. From concept to championship, we are your design partners.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "Concept development & storyboard",
                  "Custom wind & percussion arrangement",
                  "Drill design & visual coordination",
                  "Sound design & electronics",
                  "Ongoing consultation throughout the season"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-brand-electric shrink-0" />
                    <span className="text-gray-200">{item}</span>
                  </li>
                ))}
              </ul>
              <Button size="lg" className="bg-brand-electric text-brand-midnight hover:bg-brand-electric/90" asChild>
                <Link href="/contact">Start Your Design</Link>
              </Button>
            </div>
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-white/5 backdrop-blur-sm aspect-video flex items-center justify-center group">
                 {/* Abstract visual representation of a show design */}
                 <div className="text-center p-8">
                    <Layers className="w-24 h-24 text-brand-sky mx-auto mb-4 opacity-80 group-hover:scale-110 transition-transform duration-500" />
                    <p className="text-brand-sky font-heading text-xl">Comprehensive Design Package</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Components Grid */}
      <section className="py-16">
        <div className="plus-container">
          <div className="text-center mb-16">
            <h2 className="plus-h2 mb-4 text-brand-midnight">A La Carte Design</h2>
            <p className="plus-body-lg max-w-2xl mx-auto">
              Need specific components? We offer high-quality design elements to complete your production.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <SpotlightCard className="h-full border-t-4 border-t-brand-electric bg-card">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-brand-electric/10 flex items-center justify-center mb-4">
                  <Music className="w-6 h-6 text-brand-electric" />
                </div>
                <CardTitle className="text-xl">Music Design</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Wind, percussion, and sound design for ensembles of all skill levels. We write to your band&apos;s specific instrumentation and ability.
                </p>
              </CardContent>
            </SpotlightCard>

            <SpotlightCard className="h-full border-t-4 border-t-brand-sky bg-card">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-brand-sky/10 flex items-center justify-center mb-4">
                  <Eye className="w-6 h-6 text-brand-sky" />
                </div>
                <CardTitle className="text-xl">Visual Design</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Coordinated staging and drill design that amplifies musical moments. Clear, teachable, and effective visual packages.
                </p>
              </CardContent>
            </SpotlightCard>

            <SpotlightCard className="h-full border-t-4 border-t-brand-turf bg-card">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-brand-turf/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-brand-turf" />
                </div>
                <CardTitle className="text-xl">Choreography</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Wind and guard choreography packages to elevate visual impact. We create movement that enhances the music and is achievable for students.
                </p>
              </CardContent>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* Program Support & Education - Alternating Sections */}
      <section className="py-16 bg-muted/30">
        <div className="plus-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            <div className="order-2 lg:order-1 grid grid-cols-2 gap-4">
               <Card className="bg-white shadow-sm border-none p-6">
                  <Calendar className="w-8 h-8 text-brand-midnight mb-3" />
                  <h3 className="font-bold text-lg mb-2">Coordination</h3>
                  <p className="text-sm text-muted-foreground">One point of contact and clear timelines.</p>
               </Card>
               <Card className="bg-white shadow-sm border-none p-6 mt-8">
                  <Play className="w-8 h-8 text-brand-electric mb-3" />
                  <h3 className="font-bold text-lg mb-2">Judging</h3>
                  <p className="text-sm text-muted-foreground">Feedback to help you prepare for competition.</p>
               </Card>
               <Card className="bg-white shadow-sm border-none p-6">
                  <Lightbulb className="w-8 h-8 text-brand-sky mb-3" />
                  <h3 className="font-bold text-lg mb-2">Build Your Show</h3>
                  <p className="text-sm text-muted-foreground">Custom production from existing arrangements.</p>
               </Card>
               <Card className="bg-white shadow-sm border-none p-6 mt-8">
                  <GraduationCap className="w-8 h-8 text-brand-turf mb-3" />
                  <h3 className="font-bold text-lg mb-2">Clinics</h3>
                  <p className="text-sm text-muted-foreground">On-site or virtual expert guidance.</p>
               </Card>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="plus-h2 mb-6 text-brand-midnight">Support Beyond Design</h2>
              <p className="plus-body-lg mb-6">
                A great show is just the beginning. We offer comprehensive support services to help you teach, refine, and perfect your production throughout the season.
              </p>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-brand-midnight/10 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-brand-midnight" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-brand-midnight">Consultation & Teaching</h3>
                    <p className="text-muted-foreground">Expert guidance on show design, program development, and competitive strategy available as one-time sessions or ongoing support.</p>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Button variant="outline" asChild>
                  <Link href="/contact">Request Support</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Teaser */}
      <section id="process" className="plus-section bg-background">
        <div className="plus-container">
          <div className="text-center mb-12">
            <h2 className="plus-h2 mb-4 text-brand-midnight">Our Design Process</h2>
            <p className="plus-body-lg max-w-2xl mx-auto">
              A proven, collaborative approach — from first consultation to opening night.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
            {[
              { n: 1, label: 'Consultation', icon: MessageSquare, color: 'text-brand-electric' },
              { n: 2, label: 'Contracts', icon: FileText, color: 'text-brand-sky' },
              { n: 3, label: 'Design Concepts', icon: Lightbulb, color: 'text-brand-turf' },
              { n: 4, label: 'Drafts', icon: PenTool, color: 'text-brand-electric' },
              { n: 5, label: 'Completion', icon: CheckCircle, color: 'text-brand-sky' },
              { n: 6, label: 'Support', icon: Headphones, color: 'text-brand-turf' },
            ].map(({ n, label, icon: Icon, color }) => (
              <div key={n} className="flex flex-col items-center text-center gap-2 p-4 rounded-xl border bg-card">
                <div className="w-9 h-9 rounded-full bg-brand-midnight text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {n}
                </div>
                <Icon className={`w-5 h-5 ${color}`} />
                <span className="text-sm font-medium text-brand-midnight leading-tight">{label}</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button variant="outline" size="lg" asChild>
              <Link href="/process" className="inline-flex items-center gap-2">
                See the full process
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
