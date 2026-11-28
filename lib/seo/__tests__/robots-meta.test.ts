import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { generateMetadata } from '@/lib/seo/metadata'

/**
 * Robots directives come from each page's metadata (lib/seo/metadata.ts) and
 * nowhere else. A hard-coded `index,follow` tag in the root layout is emitted
 * on every page, next to the `noindex` of a thin arrangement page or a draft
 * article, and the two contradict each other.
 */
describe('robots meta', () => {
  it('is not hard-coded in the root layout', () => {
    const layout = readFileSync(join(process.cwd(), 'app/layout.tsx'), 'utf8')
    expect(layout).not.toMatch(/name="(robots|googlebot)"/)
  })

  it('follows the page: indexable by default, noindex when the page asks', () => {
    expect(generateMetadata({ title: 't', description: 'd' }).robots).toMatchObject({ index: true })
    expect(generateMetadata({ title: 't', description: 'd', noindex: true }).robots).toMatchObject({ index: false })
  })
})
