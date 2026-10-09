import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { collections } from '@/lib/collections'
import type { Faq } from '@/lib/content/faqs'

/** content/collections/<slug>.md: intro text, then "---faq---", then "Q: …" / "A: …" pairs. Server only. */
const cache = new Map<string, { intro: string; faq: Faq[] }>()

export function getCollectionContent(slug: string): { intro: string; faq: Faq[] } {
  if (!collections.some((c) => c.slug === slug)) throw new Error(`Unknown collection: ${slug}`)
  const hit = cache.get(slug)
  if (hit) return hit
  const raw = readFileSync(join(process.cwd(), 'content', 'collections', `${slug}.md`), 'utf8')
  const [intro, faqRaw = ''] = raw.split(/^---faq---$/m)
  const faq: Faq[] = []
  const re = /^Q:\s*(.+)\n(?:A:\s*)([\s\S]+?)(?=\nQ:|\s*$)/gm
  for (let m = re.exec(faqRaw); m; m = re.exec(faqRaw)) faq.push({ question: m[1].trim(), answer: m[2].trim() })
  const result = { intro: intro.trim(), faq }
  cache.set(slug, result)
  return result
}
