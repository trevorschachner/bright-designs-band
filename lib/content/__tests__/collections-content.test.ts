import { describe, expect, it } from 'vitest'
import { collections } from '@/lib/collections'
import { getCollectionContent } from '@/lib/content/collections'
describe('collection content files', () => {
  for (const c of collections) {
    it(`${c.slug} has 300+ words of intro and 3 FAQs`, () => {
      const { intro, faq } = getCollectionContent(c.slug)
      expect(intro.split(/\s+/).length).toBeGreaterThanOrEqual(300)
      expect(faq).toHaveLength(3)
      expect(intro + faq.map((f) => f.answer).join(' ')).not.toContain('$')
    })
  }
  it('rejects unknown slugs', () => {
    expect(() => getCollectionContent('../etc/passwd')).toThrow('Unknown collection')
  })
  it('memoizes reads', () => {
    expect(getCollectionContent(collections[0].slug)).toBe(getCollectionContent(collections[0].slug))
  })
})
