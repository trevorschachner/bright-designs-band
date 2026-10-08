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
import { JsonLd } from '@/components/features/seo/JsonLd'
import { createFAQSchema } from '@/lib/seo/structured-data'
import { FAQ_SECTIONS, FAQS } from '@/lib/content/faqs'

export const metadata: Metadata = buildMetadata(pageSEOConfigs.faqs)

// Built from the same array the page renders, so the schema never drifts from the copy.
const faqSchema = createFAQSchema(FAQS)

export default function FaqsPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={faqSchema} />
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
          {FAQ_SECTIONS.map((section) => (
            <div key={section.category}>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">
                {section.category}
              </h2>
              <Accordion type="multiple" className="frame-card divide-y divide-border rounded-lg overflow-hidden">
                {section.items.map((item, i) => (
                  <AccordionItem key={i} value={`${section.category}-${i}`} className="border-none px-5">
                    <AccordionTrigger className="text-left font-medium text-base py-4 hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                      {item.answer}
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
