import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, Clock } from 'lucide-react'
import { ArticleBody } from '@/components/features/articles/ArticleBody'
import { JsonLd } from '@/components/features/seo/JsonLd'
import { formatDate } from '@/lib/blog/posts'
import { getCollectionBySlug } from '@/lib/collections'
import { getArticle, routableArticles } from '@/lib/content/articles'
import { generateMetadata as buildMetadata } from '@/lib/seo/metadata'
import { articleTitle } from '@/lib/seo/titles'
import { createArticleSchema, createBreadcrumbSchema, createFAQSchema } from '@/lib/seo/structured-data'
import { getShowIndex } from '@/lib/services/shows'

/**
 * /blog/<slug>: one article from content/articles. Every routable article is
 * prerendered and nothing else resolves, so a draft that is not routable in
 * production is a 404 there.
 */
export const dynamicParams = false

export function generateStaticParams() {
  return routableArticles().map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) return buildMetadata({ title: 'Article not found', description: 'This article does not exist.', noindex: true })
  return buildMetadata({
    title: articleTitle(article.title),
    description: article.description,
    path: article.href,
    noindex: article.isDraft,
  })
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) notFound()

  const showTitles = new Map((await getShowIndex()).map((show) => [show.slug, show.title]))
  const relatedShows = article.relatedShows.filter((show) => showTitles.has(show))
  const relatedCollections = article.relatedCollections.flatMap((collection) => getCollectionBySlug(collection) ?? [])

  return (
    <div className="min-h-screen bg-background">
      {article.datePublished ? (
        <JsonLd
          data={createArticleSchema({
            headline: article.title,
            description: article.description,
            author: article.author,
            datePublished: article.datePublished,
            dateModified: article.dateModified ?? undefined,
            image: `${article.href}/opengraph-image`,
          })}
        />
      ) : null}
      {article.faq.length > 0 ? <JsonLd data={createFAQSchema(article.faq)} /> : null}
      <JsonLd
        data={createBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Blog', url: '/blog' },
          { name: article.title, url: article.href },
        ])}
      />

      <header className="plus-section pb-8 sm:pb-12 rounded-b-3xl">
        <div className="plus-container">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium line-clamp-1">{article.title}</span>
          </nav>

          {article.isDraft ? (
            <p className="mb-6 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
              Draft: not published. Visible on preview links only.
            </p>
          ) : null}

          <h1 className="plus-h1 mb-4 max-w-3xl">{article.title}</h1>
          <p className="plus-body-lg max-w-2xl">{article.description}</p>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span>By {article.author}</span>
            {article.datePublished ? <time dateTime={article.datePublished}>{formatDate(article.datePublished)}</time> : null}
            {article.dateModified && article.dateModified !== article.datePublished ? (
              <span>
                Updated <time dateTime={article.dateModified}>{formatDate(article.dateModified)}</time>
              </span>
            ) : null}
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> {article.readingTime} min read
            </span>
          </div>
        </div>
      </header>

      <article className="py-12 sm:py-16">
        <div className="plus-container">
          <div className="mx-auto max-w-3xl">
            <ArticleBody blocks={article.blocks} />

            {article.faq.length > 0 ? (
              <section className="mt-16" aria-labelledby="article-faq">
                <h2 id="article-faq" className="text-2xl font-semibold mb-6">Questions directors ask</h2>
                <dl className="space-y-6">
                  {article.faq.map((item) => (
                    <div key={item.question}>
                      <dt className="font-semibold">{item.question}</dt>
                      <dd className="mt-1 text-muted-foreground">{item.answer}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            {relatedShows.length + relatedCollections.length > 0 ? (
              <section className="mt-16" aria-labelledby="article-related">
                <h2 id="article-related" className="text-2xl font-semibold mb-4">Hear it in a show</h2>
                <ul className="flex flex-wrap gap-2">
                  {relatedShows.map((show) => (
                    <li key={show}>
                      <Link href={`/shows/${show}`} className="inline-block rounded-full border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">
                        {showTitles.get(show)}
                      </Link>
                    </li>
                  ))}
                  {relatedCollections.map((collection) => (
                    <li key={collection.slug}>
                      <Link href={`/collections/${collection.slug}`} className="inline-block rounded-full border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">
                        {collection.h1}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>
      </article>
    </div>
  )
}
