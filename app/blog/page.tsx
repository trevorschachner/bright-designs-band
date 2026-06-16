import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Clock, BookOpen, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import PageHero from '@/components/layout/page-hero'
import { JsonLd } from '@/components/features/seo/JsonLd'
import { generateMetadata as buildMetadata } from '@/lib/seo/metadata'
import {
  BLOG_POSTS,
  CASE_STUDIES,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  formatDate,
  type BlogPost,
} from '@/lib/blog/posts'
import { createBreadcrumbSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = buildMetadata({
  title: 'Blog & Resources for Marching Band Directors | Bright Designs',
  description:
    'Guides, case studies, and expert insights for competitive marching band directors. Learn how to choose a designer, what to look for in a show package, and see real results from bands we\'ve worked with.',
  keywords: [
    'marching band director blog',
    'marching band show design tips',
    'band director resources',
    'how to choose a marching band designer',
    'marching band case studies',
    'BOA marching band guide',
    'competitive marching band blog',
    'marching band success stories',
  ],
  canonical: 'https://www.brightdesigns.band/blog',
})

const blogListSchema = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Bright Designs Blog',
  description: 'Expert insights, guides, and success stories for competitive marching band directors.',
  url: 'https://www.brightdesigns.band/blog',
  publisher: {
    '@type': 'Organization',
    name: 'Bright Designs',
    url: 'https://www.brightdesigns.band',
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.brightdesigns.band/logos/brightdesignslogo-main.svg',
    },
  },
  blogPost: [...BLOG_POSTS, ...CASE_STUDIES].map((post) => ({
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url: `https://www.brightdesigns.band${post.href}`,
    datePublished: post.datePublished,
    dateModified: post.dateModified || post.datePublished,
    author: {
      '@type': 'Organization',
      name: 'Bright Designs',
    },
  })),
}

const breadcrumbSchema = createBreadcrumbSchema([
  { name: 'Home', url: 'https://www.brightdesigns.band' },
  { name: 'Blog', url: 'https://www.brightdesigns.band/blog' },
])

const featuredPost = BLOG_POSTS.find((p) => p.featured) ?? BLOG_POSTS[0]
const otherPosts = BLOG_POSTS.filter((p) => p.slug !== featuredPost.slug)

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link href={post.href} className="group block h-full">
      <Card className="flex flex-col h-full hover:shadow-lg transition-all duration-300 border-t-4 border-t-brand-electric group-hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${CATEGORY_COLORS[post.category]}`}>
              {CATEGORY_LABELS[post.category]}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> {post.readingTime} min read
            </span>
          </div>
          <CardTitle className="line-clamp-2 group-hover:text-brand-electric transition-colors leading-snug">
            {post.title}
          </CardTitle>
          <CardDescription className="text-xs">{formatDate(post.datePublished)}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
        </CardContent>
        <CardFooter>
          <span className="text-brand-electric font-medium text-sm flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
            Read Article <ArrowRight className="w-4 h-4" />
          </span>
        </CardFooter>
      </Card>
    </Link>
  )
}

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={blogListSchema} />
      <JsonLd data={breadcrumbSchema} />

      <PageHero
        title="The Blog"
        subtitle="Insights, guides, and success stories for directors who want their programs to compete at the highest level."
      />

      <div className="plus-container py-16 sm:py-20">
        {/* Featured post */}
        <section aria-label="Featured article" className="mb-16">
          <Link href={featuredPost.href} className="group block">
            <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm hover:shadow-xl transition-all duration-300 group-hover:-translate-y-0.5">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Image placeholder */}
                <div className="relative h-64 md:h-full bg-gradient-to-br from-brand-midnight to-brand-electric/80 flex items-center justify-center min-h-[280px]">
                  <div className="text-white/20 text-8xl font-bold font-heading select-none">BD</div>
                  <div className="absolute inset-0 bg-brand-midnight/40" />
                </div>

                {/* Content */}
                <div className="p-8 md:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[featuredPost.category]}`}>
                      Featured · {CATEGORY_LABELS[featuredPost.category]}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {featuredPost.readingTime} min read
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-foreground mb-4 group-hover:text-brand-electric transition-colors">
                    {featuredPost.title}
                  </h2>

                  <p className="text-muted-foreground leading-relaxed mb-6">{featuredPost.excerpt}</p>

                  <div className="flex items-center justify-between">
                    <time className="text-sm text-muted-foreground" dateTime={featuredPost.datePublished}>
                      {formatDate(featuredPost.datePublished)}
                    </time>
                    <span className="text-brand-electric font-semibold text-sm flex items-center gap-1.5 group-hover:gap-3 transition-all">
                      Read the guide <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* All articles grid */}
        <section aria-label="All articles">
          <h2 className="plus-h3 mb-8">All Articles</h2>

          <div className="plus-grid-3 mb-16">
            {otherPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
            {featuredPost && <PostCard post={featuredPost} />}
          </div>
        </section>

        {/* Case Studies spotlight */}
        <section aria-label="Case studies" className="border-t pt-16">
          <div className="flex items-center gap-3 mb-8">
            <Trophy className="w-6 h-6 text-brand-electric" />
            <h2 className="plus-h3">Success Stories</h2>
          </div>

          <div className="plus-grid-3">
            {CASE_STUDIES.map((study) => (
              <Link key={study.slug} href={study.href} className="group block h-full">
                <Card className="h-full hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1 border-t-4 border-t-brand-midnight">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        <Trophy className="w-3 h-3 mr-1 text-brand-electric" />
                        {study.badge}
                      </Badge>
                    </div>
                    <CardTitle className="group-hover:text-brand-electric transition-colors text-base leading-snug">
                      {study.school}
                    </CardTitle>
                    <CardDescription className="text-xs">{study.location}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-3">{study.excerpt}</p>
                  </CardContent>
                  <CardFooter>
                    <span className="text-brand-electric font-medium text-sm flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                      Read case study <ArrowRight className="w-4 h-4" />
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
