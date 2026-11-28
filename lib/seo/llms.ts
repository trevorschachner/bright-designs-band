/**
 * /llms.txt and /llms-full.txt: the hand-written header plus the live catalog.
 * Pure functions; the routes (app/llms.txt, app/llms-full.txt) feed them the
 * cached service reads.
 *
 * Business rule: no price ever appears. Dollar signs are stripped from
 * database copy too, so a description cannot reintroduce one.
 */

import type { ShowIndexEntry } from '@/lib/services/shows'
import type { CollectionConfig } from '@/lib/collections'
import type { Faq } from '@/lib/content/faqs'
import { getPublicSiteUrl } from '@/lib/env'
import { llmsHeader } from './llms-header'

/** A published article as the llms files need it: plain text, no markup. */
export type LlmsArticle = { href: string; title: string; description: string; author: string; text: string; faq: Faq[] }

type Options = { siteUrl?: string; articles?: LlmsArticle[] }

const base = (opts?: Options) => (opts?.siteUrl ?? getPublicSiteUrl()).replace(/\/+$/, '')

/** One line of plain text: collapsed whitespace, no `$`. */
function clean(text: string | null | undefined): string {
  return (text ?? '').replace(/\$/g, '').replace(/\s+/g, ' ').trim()
}

/** The first sentence of a description (or the whole thing if it has no full stop). */
export function firstSentence(text: string | null | undefined): string {
  const flat = clean(text)
  const match = flat.match(/^.+?[.!?](?=\s|$)/)
  return match ? match[0] : flat
}

function showMeta(show: ShowIndexEntry): string {
  return [show.year ? String(show.year) : null, show.difficulty].filter(Boolean).join(', ')
}

function showLine(show: ShowIndexEntry, root: string, description: string): string {
  const meta = showMeta(show)
  const details = [meta, description].filter(Boolean).join(', ')
  return `- [${clean(show.title)}](${root}/shows/${show.slug})${details ? ` — ${details}` : ''}`
}

export function buildLlmsTxt(shows: ShowIndexEntry[], collections: CollectionConfig[], opts?: Options): string {
  const root = base(opts)
  const lines = [
    llmsHeader(root).trimEnd(),
    '',
    '## Shows',
    '',
    'Every show is for sale as-is, as arrangements to build your own, or as the start of a partial custom show.',
    '',
    ...shows.map((show) => showLine(show, root, firstSentence(show.description))),
    '',
    '## Collections',
    '',
    ...collections.map((c) => `- [${clean(c.h1)}](${root}/collections/${c.slug}) — ${clean(c.description)}`),
    ...(opts?.articles?.length
      ? ['', '## Articles', '', ...opts.articles.map((a) => `- [${clean(a.title)}](${root}${a.href}) — ${clean(a.description)}`)]
      : []),
    '',
    '## More',
    '',
    `- [Full catalog, article and FAQ text](${root}/llms-full.txt)`,
    '',
  ]
  return lines.join('\n')
}

export function buildLlmsFullTxt(shows: ShowIndexEntry[], faqs: Faq[], opts?: Options): string {
  const root = base(opts)
  const showBlocks = shows.map((show) => {
    const meta = showMeta(show)
    return [
      `### [${clean(show.title)}](${root}/shows/${show.slug})`,
      ...(meta ? ['', meta] : []),
      ...(show.description ? ['', clean(show.description)] : []),
    ].join('\n')
  })
  const faqBlocks = faqs.map((faq) => `### ${clean(faq.question)}\n\n${clean(faq.answer)}`)
  const articleBlocks = (opts?.articles ?? []).map((a) =>
    [
      `### [${clean(a.title)}](${root}${a.href})`,
      '',
      `By ${clean(a.author)}. ${clean(a.description)}`,
      '',
      a.text.replace(/\$/g, '').trim(),
      ...a.faq.flatMap((faq) => ['', `Q: ${clean(faq.question)}`, `A: ${clean(faq.answer)}`]),
    ].join('\n'),
  )
  return [
    llmsHeader(root).trimEnd(),
    '',
    '## Shows',
    '',
    showBlocks.join('\n\n'),
    ...(articleBlocks.length ? ['', '## Articles', '', articleBlocks.join('\n\n')] : []),
    '',
    '## Frequently Asked Questions',
    '',
    faqBlocks.join('\n\n'),
    '',
  ].join('\n')
}
