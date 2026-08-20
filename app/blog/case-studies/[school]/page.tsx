import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, Check, Layers, Users, Star, Music, Award, Quote, Trophy, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { JsonLd } from '@/components/features/seo/JsonLd'
import { generateMetadata as buildMetadata } from '@/lib/seo/metadata'
import { createArticleSchema, createBreadcrumbSchema } from '@/lib/seo/structured-data'
import { getCaseStudyBySlug, formatDate, CATEGORY_COLORS, CATEGORY_LABELS, CASE_STUDIES } from '@/lib/blog/posts'

interface Props {
  params: Promise<{ school: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { school } = await params
  const study = getCaseStudyBySlug(school)
  if (!study) return {}
  return buildMetadata({
    title: study.title + ' | Bright Designs',
    description: study.description,
    keywords: study.tags as string[],
    canonical: `https://www.brightdesigns.band${study.href}`,
  })
}

export function generateStaticParams() {
  // Derived from CASE_STUDIES so adding one there cannot leave this list stale.
  return CASE_STUDIES.map((study) => ({ school: study.slug }))
}

// Content per school
function TravelersRestContent() {
  return (
    <div className="prose prose-lg max-w-none">
      <div className="flex flex-wrap gap-4 mb-8 not-prose">
        <Badge variant="secondary" className="text-sm">Travelers Rest, SC</Badge>
        <Badge className="text-sm bg-brand-electric text-brand-midnight">Program Coordination</Badge>
        <Badge className="text-sm bg-brand-midnight text-white">Music Design</Badge>
      </div>

      <h2>The Context</h2>
      <p>
        Travelers Rest High School (TR) had a passionate student base and dedicated staff, but they were stuck in a
        competitive plateau. Competing in South Carolina&apos;s fierce AAA and AAAA classifications, the band was
        consistently finishing around 14th place at Upper State—just missing the cutoff for State Finals.
      </p>
      <p>
        The students were working hard, but the vehicle on the field wasn&apos;t rewarding their efforts. The show
        designs were often &quot;too safe&quot; to be competitive or &quot;too difficult&quot; to be clean.
      </p>

      <div className="my-12 p-8 bg-muted rounded-xl border-l-4 border-brand-electric not-prose">
        <Quote className="w-8 h-8 text-brand-electric mb-4 opacity-50" />
        <p className="text-xl font-medium italic text-muted-foreground mb-4">
          &quot;We needed a change. We needed a design team that understood where we were and, more importantly, where
          we wanted to go. Bright Designs didn&apos;t just write us a show; they built us a ladder.&quot;
        </p>
        <div className="font-bold text-brand-midnight">– Ryan Wilhite, Former Director of Bands</div>
      </div>

      <h2>The Strategy: &quot;Maximize GE&quot;</h2>
      <p>
        To jump from 14th place to the Top 3, we couldn&apos;t just be &quot;better.&quot; We had to be{' '}
        <strong>smarter</strong>. As <strong>Program Coordinators</strong> and <strong>Music Designers</strong>, Bright
        Designs partnered with TR&apos;s staff to implement a comprehensive strategy.
      </p>

      <h3>1. Program Coordination: The Vision</h3>
      <p>
        We worked to align every element of the production—music, visual, and props—under a single, cohesive vision.
        With a mid-sized ensemble, &quot;looking small&quot; is a death sentence on the score sheets. We coordinated
        with the visual team to ensure:
      </p>
      <ul>
        <li><strong>Strategic Staging:</strong> Compressed staging to create visual density and integrate winds and guard.</li>
        <li><strong>Prop Integration:</strong> Using scenic elements to frame the field, focusing the audience&apos;s eye and making the band appear larger.</li>
      </ul>

      <h3>2. Music Design: &quot;Goldilocks&quot; Difficulty</h3>
      <p>
        Previous shows often exposed student weaknesses. We pivoted to writing <strong>achievable vocabulary</strong>.
        The wind book was designed to sound sophisticated and full, but lay comfortably in the students&apos; ranges.
        This allowed the students to play with confidence, volume, and great intonation—factors that immediately
        boosted Music Analysis scores.
      </p>

      <h3>3. Cohesive Conceptual Design</h3>
      <p>
        We moved away from abstract themes to clear, emotionally resonant concepts. Whether it was a darker, intense
        show or a lighthearted production, every musical and visual moment served a single, unified idea that judges
        could instantly grasp and reward.
      </p>

      <h2>The Outcome</h2>
      <p>
        The results were historic for the program. In the first year of our partnership, Travelers Rest didn&apos;t
        just make finals—they skyrocketed up the rankings.
      </p>
      <ul>
        <li><strong>State Finals:</strong> TR became a consistent State Medalist (Top 3), earning multiple caption awards for Visual Performance and General Effect.</li>
        <li><strong>Regional Success:</strong> The success translated to the national stage, with the band becoming a frequent <strong>BOA Regional Finalist</strong>, competing against some of the best programs in the Southeast.</li>
      </ul>
      <p>
        Most importantly, the culture of the program shifted. The students now <em>expect</em> excellence because they
        know their show gives them the opportunity to achieve it.
      </p>
    </div>
  )
}

function DormanContent() {
  return (
    <div className="prose prose-lg max-w-none">
      <div className="flex flex-wrap gap-4 mb-8 not-prose">
        <Badge variant="secondary" className="text-sm">Roebuck, SC</Badge>
        <Badge className="text-sm bg-brand-electric text-brand-midnight">Program Coordination</Badge>
        <Badge className="text-sm bg-brand-midnight text-white">Music Design</Badge>
      </div>

      <h2>The Unique Challenge of &quot;Big&quot;</h2>
      <p>
        Dorman High School fields one of the largest ensembles in South Carolina, consistently marching over 200
        students. While size is an advantage for volume, it presents significant design hurdles:
      </p>
      <ul>
        <li><strong>Clarity:</strong> A 200-piece band can easily sound &quot;muddy&quot; or chaotic if the scoring is too dense.</li>
        <li><strong>Visual Readability:</strong> Moving that many bodies requires expert drill design to avoid clutter and ensure forms are readable from the press box.</li>
        <li><strong>Pacing:</strong> Managing the energy of a large group so they don&apos;t burn out by the opener&apos;s end.</li>
      </ul>

      <h2>The Solution: Layered Design</h2>
      <p>
        For Dorman, Bright Designs served as <strong>Program Coordinators</strong> and <strong>Music Designers</strong>,
        implementing a philosophy of &quot;Clarity through Layering.&quot;
      </p>

      <div className="grid md:grid-cols-2 gap-8 my-12 not-prose">
        <div className="bg-muted p-6 rounded-xl">
          <Layers className="w-8 h-8 text-brand-electric mb-4" />
          <h3 className="text-xl font-bold mb-2">Music Design: Orchestration</h3>
          <p className="text-muted-foreground text-sm">
            We scored the winds to ensure the melody always cuts through. By using &quot;pyramid balance&quot; in the
            writing itself, we ensure the low brass provides a massive, warm foundation without obscuring the woodwind
            flourishes.
          </p>
        </div>
        <div className="bg-muted p-6 rounded-xl">
          <Users className="w-8 h-8 text-brand-electric mb-4" />
          <h3 className="text-xl font-bold mb-2">Program Coordination: Visual Scope</h3>
          <p className="text-muted-foreground text-sm">
            Working with the drill writer, we coordinated a visual package that utilized the full field. We ensured
            large-scale forms allowed the sheer mass of the band to be a &quot;wow&quot; factor while using staging to
            hide transitions and maintain flow.
          </p>
        </div>
      </div>

      <h3>Balancing Accessibility and Achievement</h3>
      <p>
        With a band this size, ability levels vary wildly. We write &quot;tiered&quot; parts—Lead Trumpet parts that
        challenge the All-State players, supported by 2nd and 3rd parts that allow freshmen to contribute successfully.
        This ensures the <em>entire</em> ensemble sounds great, not just the top 10%.
      </p>

      <h2>The Outcome</h2>
      <p>
        Dorman continues to be a perennial <strong>State Finalist</strong> and a dominant force in SCBDA 5A
        competition. Their productions are renowned for their massive, wall-of-sound impact and visual grandeur. Year
        after year, judges comment on the &quot;professionalism&quot; and &quot;maturity&quot; of the
        ensemble&apos;s sound—a direct result of design that prioritizes clarity and tone quality.
      </p>
    </div>
  )
}

function AlpharettaContent() {
  return (
    <div className="prose prose-lg max-w-none">
      <div className="flex flex-wrap gap-4 mb-8 not-prose">
        <Badge variant="secondary" className="text-sm">Alpharetta, GA</Badge>
        <Badge className="text-sm bg-brand-midnight text-white">Program Coordination</Badge>
        <Badge className="text-sm bg-brand-electric text-brand-midnight">Music Design</Badge>
      </div>

      <h2>The Competitive Landscape</h2>
      <p>
        Alpharetta High School competes in the Atlanta metro area—one of the most competitive marching band regions in
        the country. To stand out against national-caliber programs, &quot;clean&quot; isn&apos;t enough. You need to
        be <strong>artistically sophisticated</strong>.
      </p>
      <p>
        The program needed a design vehicle that could showcase their high individual achievement while presenting a
        cohesive, intellectual, and emotional product that appealed to BOA (Bands of America) adjudication sheets.
      </p>

      <h2>The Solution: Custom Tailoring</h2>
      <p>
        As <strong>Program Coordinators</strong> and <strong>Music Designers</strong>, Bright Designs delivered a
        fully custom package designed to exploit the band&apos;s specific strengths.
      </p>

      <div className="my-10 space-y-6 not-prose">
        {[
          {
            Icon: Star,
            title: 'Feature Moments',
            body: "We identified their top soloists early in the process and wrote specific features (e.g., Flute & Clarinet duets, Trombone quartets) that allowed them to max out the \"Individual Music\" caption.",
          },
          {
            Icon: Music,
            title: 'Sonic Depth',
            body: "The arrangements utilized extended harmonies and varied textures. Instead of just \"loud,\" we explored the full dynamic range, creating moments of silence and intimacy that drew the audience in before hitting them with the full ensemble impact.",
          },
          {
            Icon: Award,
            title: 'Percussion Integration',
            body: "The percussion book wasn't an afterthought. It was woven into the wind score, providing rhythmic drive and color without overpowering the melodic lines.",
          },
        ].map(({ Icon, title, body }) => (
          <div key={title} className="flex gap-4 items-start">
            <div className="bg-brand-electric/20 p-3 rounded-full text-brand-midnight shrink-0">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xl font-bold mb-1">{title}</h4>
              <p className="text-muted-foreground text-sm">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <h2>The Outcome</h2>
      <p>
        Alpharetta has solidified its reputation as a sophisticated, high-achieving program. They are a consistent{' '}
        <strong>BOA Regional Finalist</strong>, earning high praise specifically for General Effect and Music
        Performance. The custom design allows them to compete toe-to-toe with the largest programs in the Southeast by
        being smarter, clearer, and more musical.
      </p>
    </div>
  )
}

const CONTENT_MAP: Record<string, () => JSX.Element> = {
  'travelers-rest': TravelersRestContent,
  dorman: DormanContent,
  alpharetta: AlpharettaContent,
}

const STATS_MAP: Record<string, Array<{ value: string; label: string }>> = {
  'travelers-rest': [
    { value: '14th', label: 'Previous Ranking' },
    { value: 'Top 3', label: 'Consistent Medalist' },
    { value: '10+', label: 'Caption Awards' },
  ],
  dorman: [
    { value: '200+', label: 'Students' },
    { value: 'State', label: 'Finalist' },
    { value: '5A', label: 'Classification' },
  ],
  alpharetta: [
    { value: 'BOA', label: 'Regional Finalist' },
    { value: 'ATL', label: 'Metro Area' },
    { value: 'Top 5', label: 'GE Scores' },
  ],
}

export default async function CaseStudyPage({ params }: Props) {
  const { school } = await params
  const study = getCaseStudyBySlug(school)
  if (!study) notFound()

  // CASE_STUDIES and CONTENT_MAP are separate lists; a study without prose
  // should 404 rather than render `undefined` and throw a 500.
  const ContentComponent = CONTENT_MAP[school]
  if (!ContentComponent) notFound()
  const stats = STATS_MAP[school] ?? []

  const articleSchema = createArticleSchema({
    headline: study.title,
    description: study.description,
    author: study.author,
    datePublished: study.datePublished,
    dateModified: study.dateModified,
  })

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Home', url: 'https://www.brightdesigns.band' },
    { name: 'Blog', url: 'https://www.brightdesigns.band/blog' },
    { name: 'Success Stories', url: 'https://www.brightdesigns.band/blog/case-studies' },
    { name: study.school, url: `https://www.brightdesigns.band${study.href}` },
  ])

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />

      {/* Header */}
      <header className="plus-section pb-8 sm:pb-12 rounded-b-3xl">
        <div className="plus-container">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8 flex-wrap">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/blog/case-studies" className="hover:text-foreground transition-colors">Success Stories</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">{study.school}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[study.category]}`}>
              {CATEGORY_LABELS[study.category]}
            </span>
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <Trophy className="w-3 h-3 text-brand-electric" /> {study.badge}
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> {study.readingTime} min read
            </span>
            <time className="text-sm text-muted-foreground" dateTime={study.datePublished}>
              {formatDate(study.datePublished)}
            </time>
          </div>

          <h1 className="plus-h1 mb-4 max-w-3xl">{study.school}</h1>
          <p className="plus-body-lg max-w-xl">{study.excerpt}</p>
        </div>
      </header>

      {/* Article body */}
      <article className="py-12 sm:py-16">
        <div className="plus-container">
          <div className="mx-auto max-w-3xl">
            {/* Hero image */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-12 border shadow-xl bg-gradient-to-br from-brand-midnight to-brand-electric/60">
              <Image
                src="/placeholder.svg"
                alt={`${study.school} Marching Band`}
                fill
                className="object-cover mix-blend-overlay opacity-20"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white/20 text-7xl font-bold font-heading select-none">BD</span>
              </div>
            </div>

            {/* Content */}
            <ContentComponent />

            {/* Stats */}
            {stats.length > 0 && (
              <div className="mt-16 p-8 bg-brand-midnight text-white rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold mb-8 font-heading text-center">By The Numbers</h3>
                <div className="grid sm:grid-cols-3 gap-8 text-center">
                  {stats.map(({ value, label }) => (
                    <div key={label}>
                      <div className="text-5xl font-bold text-brand-electric mb-2">{value}</div>
                      <div className="text-sm text-gray-300 uppercase tracking-wider">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="mt-16 text-center">
              <h3 className="text-2xl font-bold mb-4 font-heading">Ready to write your own turnaround story?</h3>
              <Button
                size="lg"
                className="bg-brand-electric text-brand-midnight hover:bg-brand-midnight hover:text-white transition-colors"
                asChild
              >
                <Link href="/contact">Let&apos;s Talk Design</Link>
              </Button>
            </div>

            {/* Back links */}
            <div className="mt-12 pt-8 border-t flex items-center justify-between">
              <Link href="/blog/case-studies" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors">
                <ChevronRight className="w-4 h-4 rotate-180" /> All Success Stories
              </Link>
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
