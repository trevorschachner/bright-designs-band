import { describe, it, expect } from 'vitest'
import { normaliseSlug, slugFromTitle } from '@/lib/slug'

/** The canonical slug form the 2026-10-07 migration pre-check looks for. */
const CANONICAL = /^[a-z0-9]+(?:-[a-z0-9]+)*$/ // lib/validation/shows.ts

describe('normaliseSlug', () => {
  it('lowercases', () => {
    expect(normaliseSlug('True-North')).toBe('true-north')
  })

  it('trims surrounding whitespace', () => {
    expect(normaliseSlug('  true-north \n')).toBe('true-north')
  })

  it('collapses runs of dashes and strips leading/trailing ones', () => {
    expect(normaliseSlug('--true---north-')).toBe('true-north')
  })

  it('leaves a canonical slug unchanged', () => {
    for (const s of ['true-north', '1984', 'a-b-c']) expect(normaliseSlug(s)).toBe(s)
  })

  it('is idempotent', () => {
    const once = normaliseSlug(' A--B ')
    expect(normaliseSlug(once)).toBe(once)
  })
})

describe('slugFromTitle', () => {
  it('produces a slug the write-side validator accepts', () => {
    for (const title of ['True North', "Rock 'n' Roll!", '  Spaces   and__underscores ', 'Already-Hyphen--ated']) {
      expect(slugFromTitle(title)).toMatch(CANONICAL)
    }
  })

  it('matches the old POST /api/shows behaviour for ordinary titles', () => {
    expect(slugFromTitle('The Great Gatsby: Part 2')).toBe('the-great-gatsby-part-2')
  })
})
