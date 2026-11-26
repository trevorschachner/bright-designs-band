import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, posix } from 'node:path'
import type { Faq } from '@/lib/content/faqs'
import { blocksToText, parseMarkdown, type Block } from '@/lib/content/markdown'

/**
 * Articles live in content/articles/<slug>.md: a `key: value` header between
 * `---` lines, the body, then `---faq---` and "Q: …" / "A: …" pairs (the same
 * FAQ shape as content/collections). Figures live in
 * public/articles/<slug>/. Server only.
 *
 * An article is a draft until an owner gives it a `datePublished`
 * (YYYY-MM-DD). Drafts never reach production: they are left out of the
 * route, the blog index, the sitemap and llms-full.txt. They render, marked
 * noindex, on Netlify deploy previews and in development, so an owner can
 * read one at a URL before dating it.
 */

export type ArticleFigure = { src: string; alt: string; caption: string; width: number; height: number }
export type ArticleBlock = Exclude<Block, { kind: 'figure' }> | ({ kind: 'figure' } & ArticleFigure)

export type Article = {
  slug: string
  href: string
  title: string
  description: string
  author: string
  datePublished: string | null
  dateModified: string | null
  relatedShows: string[]
  relatedCollections: string[]
  blocks: ArticleBlock[]
  faq: Faq[]
  wordCount: number
  readingTime: number
  isDraft: boolean
}

const DIR = () => join(process.cwd(), 'content', 'articles')
const DATE = /^\d{4}-\d{2}-\d{2}$/
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Drafts are readable on Netlify deploy previews and in `next dev`, never in production. */
export function draftsVisible(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.CONTEXT === 'deploy-preview' || env.CONTEXT === 'branch-deploy' || env.NODE_ENV === 'development'
}

function list(value: string | undefined): string[] {
  return (value ?? '').split(',').map((item) => item.trim()).filter(Boolean)
}

/** `fig.svg` is this article's figure; `../other-slug/fig.svg` borrows another article's. */
function figurePath(slug: string, src: string): string {
  if (/^(https?:)?\/\//.test(src) || src.startsWith('/')) return src
  return posix.normalize(posix.join('/articles', slug, src))
}

/** Width and height from an SVG's viewBox, so the page reserves the space before the image loads. */
function figureSize(publicPath: string): { width: number; height: number } {
  const fallback = { width: 880, height: 400 }
  if (!publicPath.startsWith('/articles/') || !publicPath.endsWith('.svg')) return fallback
  const file = join(process.cwd(), 'public', publicPath)
  if (!existsSync(file)) throw new Error(`Article figure not found: public${publicPath}`)
  const box = readFileSync(file, 'utf8').match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
  return box ? { width: Number(box[1]), height: Number(box[2]) } : fallback
}

export function parseArticle(slug: string, raw: string): Article {
  const text = raw.replace(/\r\n/g, '\n')
  const header = text.match(/^---\n([\s\S]*?)\n---\n/)
  if (!header) throw new Error(`Article ${slug} has no header`)
  const meta: Record<string, string> = {}
  for (const line of header[1].split('\n')) {
    const pair = line.match(/^([A-Za-z]+):\s*(.*)$/)
    if (pair) meta[pair[1]] = pair[2].trim()
  }
  for (const key of ['title', 'description', 'author']) {
    if (!meta[key]) throw new Error(`Article ${slug} is missing "${key}"`)
  }

  const [body, faqRaw = ''] = text.slice(header[0].length).split(/^---faq---$/m)
  const faq: Faq[] = []
  const re = /^Q:\s*(.+)\n(?:A:\s*)([\s\S]+?)(?=\nQ:|\n<!--|\s*$)/gm
  for (let m = re.exec(faqRaw); m; m = re.exec(faqRaw)) faq.push({ question: m[1].trim(), answer: m[2].trim() })

  const blocks: ArticleBlock[] = parseMarkdown(body).map((block) => {
    if (block.kind !== 'figure') return block
    const src = figurePath(slug, block.src)
    return { ...block, src, ...figureSize(src) }
  })
  const wordCount = blocksToText(blocks).split(/\s+/).filter(Boolean).length
  const datePublished = DATE.test(meta.datePublished ?? '') ? meta.datePublished : null

  return {
    slug,
    href: `/blog/${slug}`,
    title: meta.title,
    description: meta.description,
    author: meta.author,
    datePublished,
    dateModified: DATE.test(meta.dateModified ?? '') ? meta.dateModified : null,
    relatedShows: list(meta.relatedShows),
    relatedCollections: list(meta.relatedCollections),
    blocks,
    faq,
    wordCount,
    readingTime: Math.max(1, Math.round(wordCount / 220)),
    isDraft: datePublished === null,
  }
}

let cache: Article[] | null = null

/** Every article file, drafts included, newest first (drafts last). */
export function allArticles(): Article[] {
  if (cache) return cache
  const dir = DIR()
  const files = existsSync(dir) ? readdirSync(dir).filter((name) => name.endsWith('.md')) : []
  const articles = files.map((name) => {
    const slug = name.replace(/\.md$/, '')
    if (!SLUG.test(slug)) throw new Error(`Article file name is not a slug: ${name}`)
    return parseArticle(slug, readFileSync(join(dir, name), 'utf8'))
  })
  cache = articles.sort((a, b) => (b.datePublished ?? '').localeCompare(a.datePublished ?? '') || a.slug.localeCompare(b.slug))
  return cache
}

/** What the public site lists: dated articles only. */
export function publishedArticles(): Article[] {
  return allArticles().filter((article) => !article.isDraft)
}

/** What the route serves: published articles, plus drafts where drafts are visible. */
export function routableArticles(env: NodeJS.ProcessEnv = process.env): Article[] {
  return draftsVisible(env) ? allArticles() : publishedArticles()
}

export function getArticle(slug: string, env: NodeJS.ProcessEnv = process.env): Article | undefined {
  return routableArticles(env).find((article) => article.slug === slug)
}

/** Published articles in the plain-text shape /llms.txt and /llms-full.txt publish. */
export function articlesForLlms() {
  return publishedArticles().map((article) => ({
    href: article.href,
    title: article.title,
    description: article.description,
    author: article.author,
    text: blocksToText(article.blocks),
    faq: article.faq,
  }))
}
