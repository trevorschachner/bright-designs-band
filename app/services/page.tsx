import { MessageSquare, Lightbulb, FileText, PenTool, CheckCircle, Headphones } from "lucide-react"
import ServicesGrid, { ServiceItem } from "@/components/features/services/services-grid"
import PageHero from "@/components/layout/page-hero"

export default function ServicesPage() {
  const servicesItems = [
    {
      title: "Custom Show Design",
      description: "Full show packages and white‑glove support—from concept to delivery—engineered for competitive success.",
      icon: "music",
    },
    {
      title: "Music Design",
      description: "Wind, percussion, and sound design that highlights strengths and clarifies effect.",
      icon: "music",
    },
    {
      title: "Visual Design",
      description: "Coordinated staging and choreography that amplify musical moments and effect.",
      icon: "eye",
    },
    {
      title: "Program Coordination",
      description: "One point of contact, clear timelines, and dependable delivery across the season.",
      icon: "calendar",
    },
    {
      title: "Build Your Show",
      description: "Select any of our arrangements and we’ll craft a cohesive custom production around it—movement by movement.",
      icon: "music",
    },
    {
      title: "Choreography",
      description: "Wind and guard choreography packages to elevate clarity, coordination, and effect.",
      icon: "eye",
    },
    {
      title: "Clinics",
      description: "On-site or virtual music/visual clinics focused on clarity, pacing, and effect.",
      icon: "users",
    },
    {
      title: "Judging",
      description: "Adjudication and feedback services to align design with scoring priorities.",
      icon: "play",
    },
  ]
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <PageHero
        title="Our Services"
        subtitle="Comprehensive design solutions tailored to your ensemble's unique needs"
      />
      {/* Services Section */}
      <ServicesGrid
        items={servicesItems as ServiceItem[]}
        cta={{ label: "Schedule a Consultation", href: "/contact" }}
      />  
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
                      Our team develops multiple creative concepts tailored to your ensemble&apos;s unique strengths and competitive goals.
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
                      Ongoing support throughout your season—we&apos;re here to help with questions, adjustments, and guidance.
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
                    Our team develops multiple creative concepts tailored to your ensemble&apos;s unique strengths and competitive goals.
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
                    Ongoing support throughout your season—we&apos;re here to help with questions, adjustments, and guidance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}