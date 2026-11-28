import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Crawlers that do not run JavaScript (GPTBot, ClaudeBot, PerplexityBot) read
 * the HTML in source order. A `loading.tsx` on a prerendered route, or a
 * Suspense fallback around `children` in the root layout, makes Next emit the
 * skeleton and the footer first and the page content afterwards in a hidden
 * block that a script moves into place. These routes are prerendered, so a
 * loading state buys nothing and costs the reading order.
 */
const root = process.cwd()
const PRERENDERED = ['', 'about', 'contact', 'faqs', 'process', 'services', 'shows/[slug]', 'blog', 'collections', 'collections/[slug]']

describe('page content comes before the footer in the HTML', () => {
  it.each(PRERENDERED)('app/%s has no loading.tsx', (route) => {
    expect(existsSync(join(root, 'app', route, 'loading.tsx'))).toBe(false)
  })

  it('the root layout does not wrap children in a Suspense fallback', () => {
    const layout = readFileSync(join(root, 'app/layout.tsx'), 'utf8')
    expect(layout).not.toMatch(/<Suspense/)
    expect(layout).toMatch(/<main>\{children\}<\/main>/)
  })
})
