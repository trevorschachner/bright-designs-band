import { Metadata } from 'next'
import Link from 'next/link'
import { Check, X, AlertTriangle, Clock, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { JsonLd } from '@/components/features/seo/JsonLd'
import { generateMetadata as buildMetadata } from '@/lib/seo/metadata'
import { createArticleSchema, createBreadcrumbSchema } from '@/lib/seo/structured-data'
import { getPostBySlug, formatDate, CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/blog/posts'

const post = getPostBySlug('how-to-choose-a-designer')!

export const metadata: Metadata = buildMetadata({
  title: post.title + ' | Bright Designs',
  description: post.description,
  keywords: post.tags as string[],
  canonical: `https://www.brightdesigns.band${post.href}`,
})

const articleSchema = createArticleSchema({
  headline: post.title,
  description: post.description,
  author: post.author,
  datePublished: post.datePublished,
  dateModified: post.dateModified,
})

const breadcrumbSchema = createBreadcrumbSchema([
  { name: 'Home', url: 'https://www.brightdesigns.band' },
  { name: 'Blog', url: 'https://www.brightdesigns.band/blog' },
  { name: post.title, url: `https://www.brightdesigns.band${post.href}` },
])

export default function HowToChooseADesignerPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />

      {/* Article header */}
      <header className="plus-section pb-8 sm:pb-12 rounded-b-3xl">
        <div className="plus-container">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium line-clamp-1">How to Choose a Designer</span>
          </nav>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[post.category]}`}>
              {CATEGORY_LABELS[post.category]}
            </span>
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> {post.readingTime} min read
            </span>
            <time className="text-sm text-muted-foreground" dateTime={post.datePublished}>
              {formatDate(post.datePublished)}
            </time>
          </div>

          <h1 className="plus-h1 mb-4 max-w-3xl">How to Choose a Marching Band Show Designer</h1>
          <p className="plus-body-lg max-w-2xl">
            The 2025 Guide for Band Directors. Avoid ghosting, missed deadlines, and unplayable parts.
          </p>

          <div className="flex flex-wrap gap-2 mt-6">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        </div>
      </header>

      {/* Article body */}
      <article className="py-12 sm:py-16">
        <div className="plus-container">
          <div className="mx-auto max-w-3xl">
            <div className="prose prose-lg max-w-none mb-16">
              <p className="lead text-xl text-muted-foreground">
                Choosing a design team is the single most important decision you make for your competitive season.
                The right partner elevates your students and makes your life easier; the wrong one causes months of
                stress, wasted rehearsals, and lower scores.
              </p>

              <p>
                With hundreds of &quot;custom design&quot; sites popping up, how do you filter the professionals from
                the hobbyists? Here is the honest truth about what to look for—and what to avoid.
              </p>

              <div className="my-12 p-6 bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 rounded-r-lg not-prose">
                <h3 className="text-amber-800 dark:text-amber-400 flex items-center gap-2 font-bold text-lg mb-3">
                  <AlertTriangle className="w-5 h-5" />
                  The &quot;Ghosting&quot; Epidemic
                </h3>
                <p className="text-amber-900 dark:text-amber-300 text-sm leading-relaxed">
                  The #1 complaint we hear from new clients isn&apos;t about bad music—it&apos;s about communication.
                  Too many designers take a deposit and then disappear until August. Your designer needs to be a{' '}
                  <strong>partner</strong>, not just a vendor.
                </p>
              </div>

              <h3>1. Reliability is a Skill</h3>
              <p>
                Does your designer reply to emails within 24 hours? Do they have a published production calendar? At
                Bright Designs, we treat show design like project management. We use a structured system to ensure you
                never have to chase us for a movement or a rewrite.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Ask for references:</strong> Don&apos;t just look at the portfolio. Ask specifically to speak
                  to a director they worked with <em>last year</em>.
                </li>
                <li>
                  <strong>Check their timeline:</strong> If they can&apos;t give you a specific delivery date for
                  &quot;Movement 2 Percussion,&quot; run away.
                </li>
              </ul>

              <h3>2. &quot;Custom&quot; Should Mean Custom</h3>
              <p>
                Many &quot;custom&quot; shows are just recycled templates with a new title. True custom design starts
                with <em>your</em> instrumentation and <em>your</em> students&apos; ability levels.
              </p>
              <p>
                If a designer doesn&apos;t ask for your <strong>Instrumentation List</strong> or{' '}
                <strong>Soloist Capabilities</strong> before writing a single note, they aren&apos;t writing for{' '}
                <em>your</em> band. They are writing for a MIDI file.
              </p>

              <h3>3. The &quot;Rewrite&quot; Policy</h3>
              <p>
                This is the hidden cost that blows up budgets. What happens if the woodwind feature is too hard? What
                if your drill writer needs 16 more counts in the ballad?
              </p>
              <p>
                Most designers charge $100–$300 per hour for edits.{' '}
                <strong>We offer unlimited difficulty adjustments at no extra cost.</strong> If it doesn&apos;t work on
                the field, we fix it. Period.
              </p>

              <h3>4. Understanding the Cost</h3>
              <p>
                Cheap design is expensive. Saving $500 on the front end often costs you hours of rehearsal time
                rewriting unplayable parts, or points on the sheets because the orchestration is muddy.
              </p>
            </div>

            {/* Comparison card */}
            <Card className="bg-muted/30 border-none mb-16 shadow-lg">
              <CardHeader>
                <CardTitle className="text-center font-heading text-2xl">The Bright Designs Difference</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-bold mb-4 text-red-500 flex items-center gap-2">
                      <X className="w-4 h-4" /> Typical Designer
                    </h4>
                    <ul className="space-y-3 text-sm">
                      <li className="flex gap-2"><X className="w-4 h-4 text-red-400 shrink-0" /> &quot;I&apos;ll get to it when I can&quot; communication</li>
                      <li className="flex gap-2"><X className="w-4 h-4 text-red-400 shrink-0" /> Charges hourly for every rewrite</li>
                      <li className="flex gap-2"><X className="w-4 h-4 text-red-400 shrink-0" /> Delivers PDF parts late in July</li>
                      <li className="flex gap-2"><X className="w-4 h-4 text-red-400 shrink-0" /> One-size-fits-all difficulty</li>
                      <li className="flex gap-2"><X className="w-4 h-4 text-red-400 shrink-0" /> Writes impossible woodwind runs</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold mb-4 text-brand-turf flex items-center gap-2">
                      <Check className="w-4 h-4" /> Bright Designs
                    </h4>
                    <ul className="space-y-3 text-sm font-medium">
                      <li className="flex gap-2"><Check className="w-4 h-4 text-brand-turf shrink-0" /> Guaranteed 24-hour response time</li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-brand-turf shrink-0" /> <strong>Free</strong> difficulty adjustments forever</li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-brand-turf shrink-0" /> Complete parts package by June 1st</li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-brand-turf shrink-0" /> Tailored to your specific instrumentation</li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-brand-turf shrink-0" /> Educational &amp; achievable scoring</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <div className="bg-brand-midnight text-white p-8 sm:p-10 rounded-2xl text-center">
              <h3 className="text-2xl font-bold mb-4 font-heading">Ready for a stress-free season?</h3>
              <p className="mb-8 text-gray-300 max-w-md mx-auto">
                Let&apos;s discuss your band&apos;s goals and how we can design a vehicle for your success.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" className="bg-brand-electric text-brand-midnight hover:bg-white" asChild>
                  <Link href="/contact">Schedule a Consultation</Link>
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10" asChild>
                  <Link href="/shows">Browse Our Catalog</Link>
                </Button>
              </div>
            </div>

            {/* Back to blog */}
            <div className="mt-12 pt-8 border-t">
              <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors">
                <ChevronRight className="w-4 h-4 rotate-180" /> Back to Blog
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}
