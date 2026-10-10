import { describe, expect, it } from 'vitest'
import mapping from '../theme-tags.json'

describe('theme-tags.json', () => {
  it('uses only declared themes and covers 34 shows', () => {
    expect(Object.keys(mapping.shows)).toHaveLength(34)
    for (const [slug, themes] of Object.entries(mapping.shows)) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      expect(themes.length).toBeGreaterThan(0)
      for (const t of themes) expect(mapping.themes).toContain(t)
    }
  })
})
