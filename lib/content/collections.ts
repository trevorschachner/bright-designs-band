import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Faq } from '@/lib/content/faqs'

/** content/collections/<slug>.md: intro text, then "---faq---", then "Q: …" / "A: …" pairs. Server only. */
export function getCollectionContent(slug: string): { intro: string; faq: Faq[] } {
  const raw = readFileSync(join(process.cwd(), 'content', 'collections', `${slug}.md`), 'utf8')
  const [intro, faqRaw = ''] = raw.split(/^---faq---$/m)
  const faq: Faq[] = []
  const re = /^Q:\s*(.+)\n(?:A:\s*)([\s\S]+?)(?=\nQ:|\s*$)/gm
  for (let m = re.exec(faqRaw); m; m = re.exec(faqRaw)) faq.push({ question: m[1].trim(), answer: m[2].trim() })
  return { intro: intro.trim(), faq }
}
