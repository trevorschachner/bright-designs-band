import type { Metadata } from 'next'
import { generateMetadata as buildMetadata, pageSEOConfigs } from '@/lib/seo/metadata'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = buildMetadata(pageSEOConfigs.faqs)

const faqs = [
  {
    category: 'Getting Started',
    items: [
      {
        q: 'How do I get started with Bright Designs?',
        a: 'The easiest way is to fill out our contact form or reach out directly. We use organized intake forms and documents to walk you through everything we need — you don\'t have to figure it out on your own. We\'ll gather information about your band size, skill level, timeline, competitive goals, and any theme ideas before we dive in.',
      },
      {
        q: 'What information do you need to design a custom show?',
        a: 'We start with a detailed intake — band size, instrumentation, skill level, competitive circuit, season timeline, budget range, and any theme or concept ideas you already have. Don\'t worry if you\'re not sure about all of it yet; we help you work through it with guiding documents and a consultation call.',
      },
      {
        q: 'Do you work with bands outside South Carolina?',
        a: 'Yes — we work with programs nationwide across all competitive circuits and levels. Distance is no barrier. Most of our collaboration happens remotely through video calls, shared documents, and audio/score deliveries.',
      },
    ],
  },
  {
    category: 'Shows & Design',
    items: [
      {
        q: 'How long does a custom show take?',
        a: 'Typically 6–12 weeks depending on scope and your timeline. Full custom productions with multiple movements take longer than a single arrangement. We\'ll set clear milestones and delivery dates upfront so you always know what\'s coming and when.',
      },
      {
        q: 'Can you adapt shows for different ensemble sizes?',
        a: 'Yes. Our arrangements scale from small bands to large programs. We write specifically to your instrumentation and ability level — not a one-size-fits-all template.',
      },
      {
        q: 'Do you offer pre-written shows, or is everything custom?',
        a: 'Both. You can browse our show catalog and license an existing production, or commission a completely original custom show built around your students. Catalog shows are a great option if you want a proven design with faster turnaround.',
      },
      {
        q: 'Can multiple bands perform the same catalog show?',
        a: 'Custom shows are always exclusive to your program. For catalog shows, we ensure regional exclusivity so you won\'t compete against another band performing the same production in your circuit.',
      },
    ],
  },
  {
    category: 'Process & Revisions',
    items: [
      {
        q: 'What does the design process look like?',
        a: 'We start with a consultation, then contracts, then concept development. From there we move into design drafts with regular delivery checkpoints. You give feedback throughout — this is a collaborative process, not a one-and-done delivery. We finish with final materials and stay available for support all season.',
      },
      {
        q: 'How many rounds of revisions are included?',
        a: 'We work collaboratively throughout the process, so revisions aren\'t limited to a set number of "rounds." We deliver drafts, collect your feedback, and keep refining until it\'s right. Clear communication at each stage means we rarely have to go back to square one.',
      },
      {
        q: 'What if we need changes mid-season?',
        a: 'We support you throughout the season. If something isn\'t working on the field, reach out and we\'ll work through it with you — whether that\'s a musical adjustment, pacing change, or a staging fix.',
      },
    ],
  },
  {
    category: 'Music & Licensing',
    items: [
      {
        q: 'Do you handle music licensing, or does the band need to do that?',
        a: 'We can handle it for you, or guide you through doing it yourself — whichever you prefer. Licensing requirements vary by circuit (BOA, WGI, state associations all have different rules), and we\'re familiar with what each requires.',
      },
      {
        q: 'What formats do you deliver?',
        a: 'It depends on what\'s ordered. A full custom show typically includes scores, individual parts, audio recordings, and drill files. We\'ll confirm exactly what\'s included in your package upfront.',
      },
      {
        q: 'Do you provide rehearsal resources?',
        a: 'Yes. Scores, parts, and audio are included as needed. We want your students to be prepared, so we provide materials that are clear and teachable from day one.',
      },
    ],
  },
  {
    category: 'Pricing & Availability',
    items: [
      {
        q: 'How much does a custom show cost?',
        a: 'Pricing varies based on scope, the number of arrangements, your band size, and what services are included. We\'re flexible and work with programs at all budget levels. Reach out for a quote — we\'ll find something that works.',
      },
      {
        q: 'What competitive circuits do you have experience with?',
        a: 'All levels — from BOA and WGI to state and regional associations. Whether you\'re competing at a local festival or a national championship, we know what judges look for and design accordingly.',
      },
    ],
  },
]

export default function FaqsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-20 max-w-3xl px-4">
        <h1 className="text-4xl font-heading font-bold text-center mb-4 text-foreground">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-center mb-12 text-muted-foreground">
          Common questions from directors. Don&apos;t see yours?{' '}
          <Link href="/contact" className="text-primary underline underline-offset-4">
            Ask us directly.
          </Link>
        </p>

        <div className="space-y-10">
          {faqs.map((section) => (
            <div key={section.category}>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">
                {section.category}
              </h2>
              <Accordion type="multiple" className="frame-card divide-y divide-border rounded-lg overflow-hidden">
                {section.items.map((item, i) => (
                  <AccordionItem key={i} value={`${section.category}-${i}`} className="border-none px-5">
                    <AccordionTrigger className="text-left font-medium text-base py-4 hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center rounded-2xl bg-muted/50 border p-8">
          <h3 className="text-xl font-heading font-bold mb-2">Still have questions?</h3>
          <p className="text-muted-foreground mb-6">
            Every program is different. Let&apos;s talk about what you actually need.
          </p>
          <Button asChild size="lg">
            <Link href="/contact">Get in Touch</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
