import { describe, expect, it } from 'vitest'
import { allArticles, draftsVisible, getArticle, parseArticle, publishedArticles, routableArticles } from '@/lib/content/articles'
import { collections } from '@/lib/collections'

const HEADER = `---
title: A title
description: A description.
author: Trevor Schachner
relatedShows: ignite, hive-mind
relatedCollections: small-band-marching-band-shows
`

const BODY = `---

First paragraph with **bold**.

## A heading

- one
- two

---faq---
Q: First question?
A: First answer.

Q: Second question?
A: Second answer.

<!-- Note to owners. Q: not a question -->
`

describe('parseArticle', () => {
  it('is a draft until it has a datePublished', () => {
    expect(parseArticle('a-slug', `${HEADER}datePublished:\n${BODY}`).isDraft).toBe(true)
    expect(parseArticle('a-slug', `${HEADER}datePublished: soon\n${BODY}`).isDraft).toBe(true)
    const dated = parseArticle('a-slug', `${HEADER}datePublished: 2026-12-01\n${BODY}`)
    expect(dated.isDraft).toBe(false)
    expect(dated.datePublished).toBe('2026-12-01')
  })

  it('reads the header, the related slugs and the FAQ, and leaves the owners note out', () => {
    const article = parseArticle('a-slug', `${HEADER}datePublished: 2026-12-01\n${BODY}`)
    expect(article).toMatchObject({
      slug: 'a-slug',
      href: '/blog/a-slug',
      title: 'A title',
      author: 'Trevor Schachner',
      relatedShows: ['ignite', 'hive-mind'],
      relatedCollections: ['small-band-marching-band-shows'],
    })
    expect(article.faq).toEqual([
      { question: 'First question?', answer: 'First answer.' },
      { question: 'Second question?', answer: 'Second answer.' },
    ])
    expect(article.blocks.map((block) => block.kind)).toEqual(['paragraph', 'heading', 'list'])
    expect(article.readingTime).toBe(1)
  })

  it('refuses a file with no header or a missing required field', () => {
    expect(() => parseArticle('x', 'No header here')).toThrow(/no header/)
    expect(() => parseArticle('x', '---\ntitle: T\ndescription: D\n---\nBody')).toThrow(/missing "author"/)
  })
})

describe('draft gating', () => {
  it('shows drafts on deploy previews and in development only', () => {
    expect(draftsVisible({ NODE_ENV: 'production' })).toBe(false)
    expect(draftsVisible({ NODE_ENV: 'production', CONTEXT: 'production' })).toBe(false)
    expect(draftsVisible({ NODE_ENV: 'production', CONTEXT: 'deploy-preview' })).toBe(true)
    expect(draftsVisible({ NODE_ENV: 'development' })).toBe(true)
  })

  it('never routes or lists a draft in production', () => {
    const production = { NODE_ENV: 'production', CONTEXT: 'production' } as NodeJS.ProcessEnv
    expect(routableArticles(production).every((article) => !article.isDraft)).toBe(true)
    expect(publishedArticles().every((article) => article.datePublished !== null)).toBe(true)
    const draft = allArticles().find((article) => article.isDraft)
    if (draft) expect(getArticle(draft.slug, production)).toBeUndefined()
  })
})

describe('the article files in content/articles', () => {
  const articles = allArticles()

  it('all parse, with a description that fits a search result', () => {
    expect(articles.length).toBeGreaterThan(0)
    for (const article of articles) {
      // Google cuts a result's description at about 160 characters.
      expect(article.description.length, article.slug).toBeLessThanOrEqual(160)
      expect(article.description, article.slug).toMatch(/[.?]$/)
      expect(article.wordCount, article.slug).toBeGreaterThan(800)
      expect(article.faq.length, article.slug).toBeGreaterThanOrEqual(3)
    }
  })

  // The owners approved prices in these two articles on 2026-11-27. Every other
  // article stays price-free so a number can't drift in unreviewed.
  const PRICED = new Set(['how-much-does-a-custom-marching-band-show-cost', 'box-show-or-custom-marching-band-show'])

  it('state a price only where the owners approved one', () => {
    for (const article of articles.filter(a => !PRICED.has(a.slug))) {
      const text = JSON.stringify([article.blocks, article.faq, article.description])
      expect(text.match(/\$\s?\d[\d,.]*/)?.[0] ?? null, article.slug).toBeNull()
    }
  })

  it('link only to articles that exist, and never from a published one to a draft', () => {
    const bySlug = new Map(articles.map((a) => [a.slug, a]))
    for (const article of articles) {
      for (const match of JSON.stringify(article.blocks).matchAll(/\/blog\/([a-z0-9-]+)/g)) {
        const target = bySlug.get(match[1])
        expect(target, `${article.slug}: /blog/${match[1]}`).toBeDefined()
        if (!article.isDraft) expect(target?.isDraft, `${article.slug} links to draft ${match[1]}`).toBe(false)
      }
    }
  })

  it('link to at least one other article', () => {
    for (const article of articles) {
      const others = [...JSON.stringify(article.blocks).matchAll(/\/blog\/([a-z0-9-]+)/g)].filter((m) => m[1] !== article.slug)
      expect(others.length, article.slug).toBeGreaterThan(0)
    }
  })

  it('link only to collections that exist', () => {
    const known = new Set(collections.map((collection) => collection.slug))
    for (const article of articles) {
      for (const slug of article.relatedCollections) expect(known.has(slug), `${article.slug}: ${slug}`).toBe(true)
      for (const match of JSON.stringify(article.blocks).matchAll(/\/collections\/([a-z0-9-]+)/g)) {
        expect(known.has(match[1]), `${article.slug}: ${match[1]}`).toBe(true)
      }
    }
  })

  it('have every figure on disk with a caption and alt text', () => {
    for (const article of articles) {
      for (const block of article.blocks) {
        if (block.kind !== 'figure') continue
        expect(block.src, article.slug).toMatch(/^\/articles\/[a-z0-9-]+\/[a-z0-9-]+\.svg$/)
        expect(block.alt.length, block.src).toBeGreaterThan(20)
        expect(block.caption.length, block.src).toBeGreaterThan(20)
        expect(block.width, block.src).toBeGreaterThan(0)
      }
    }
  })
})
