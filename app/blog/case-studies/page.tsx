import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ChevronRight, Trophy } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import PageHero from '@/components/layout/page-hero'
import { JsonLd } from '@/components/features/seo/JsonLd'
import { generateMetadata as buildMetadata } from '@/lib/seo/metadata'
import { absoluteUrl, createBreadcrumbSchema } from '@/lib/seo/structured-data'
import { CASE_STUDIES, getPostBySlug } from '@/lib/blog/posts'

const post = getPostBySlug('case-studies')!

export const metadata: Metadata = buildMetadata({
  title: 'Success Stories: Marching Band Case Studies | Bright Designs',
  description:
    'See how our custom designs helped programs like Travelers Rest, Dorman, and Alpharetta achieve State Medalist and BOA Finalist status.',
  keywords: [
    'marching band case studies',
    'marching band success stories',
    'BOA finalist case study',
    'state medalist marching band',
    'South Carolina marching band design',
    'Georgia marching band design',
  ],
  path: '/blog/case-studies',
})

const breadcrumbSchema = createBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Blog', url: '/blog' },
  { name: 'Success Stories', url: '/blog/case-studies' },
])

const itemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Marching Band Case Studies',
  description: 'Success stories from programs that partnered with Bright Designs',
  url: absoluteUrl('/blog/case-studies'),
  numberOfItems: CASE_STUDIES.length,
  itemListElement: CASE_STUDIES.map((study, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: study.title,
    description: study.description,
    url: absoluteUrl(study.href),
  })),
}

export default function CaseStudiesIndexPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={itemListSchema} />

      <PageHero
        title="Success Stories"
        subtitle="Real results from programs just like yours. See how strategic show design transforms competitive outcomes."
      >
        {/* Breadcrumbs inside hero */}
        <nav aria-label="Breadcrumb" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground mt-4">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">Success Stories</span>
        </nav>
      </PageHero>

      <div className="plus-container py-16 sm:py-20">
        {/* Case study cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {CASE_STUDIES.map((study) => (
            <Link key={study.slug} href={study.href} className="group h-full block">
              <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 border-t-4 border-t-brand-electric group-hover:-translate-y-1">
                <div className="relative h-48 bg-gradient-to-br from-brand-midnight/90 to-brand-electric/60">
                  <Image
                    src="/placeholder.svg"
                    alt={study.school}
                    fill
                    className="object-cover mix-blend-overlay opacity-30"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white/30 text-5xl font-bold font-heading select-none">BD</span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="font-bold flex items-center gap-1 shadow-sm text-xs">
                      <Trophy className="w-3 h-3 text-brand-electric" />
                      {study.badge}
                    </Badge>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="group-hover:text-brand-electric transition-colors leading-snug">
                    {study.school}
                  </CardTitle>
                  <CardDescription>{study.location}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-muted-foreground text-sm line-clamp-3">{study.excerpt}</p>
                </CardContent>
                <CardFooter>
                  <span className="text-brand-electric font-medium text-sm flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                    Read Case Study <ArrowRight className="w-4 h-4" />
                  </span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center border-t pt-16">
          <p className="text-muted-foreground mb-6 text-lg">Ready to be our next success story?</p>
          <Button size="lg" className="bg-brand-electric text-brand-midnight hover:bg-brand-midnight hover:text-white transition-colors" asChild>
            <Link href="/contact">Contact Us Today</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
