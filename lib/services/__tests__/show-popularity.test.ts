import { describe, it, expect } from 'vitest'
import { parseEndpointResponse, scoreShows } from '@/lib/services/show-popularity'

const shows = [
  { id: 1, slug: 'fast-lane', title: 'Fast Lane' },
  { id: 2, slug: '21-grams', title: '21 Grams - The Weight of a Soul' },
  { id: 3, slug: 'quiet', title: 'Quiet' },
]

describe('scoreShows', () => {
  it('adds page visitors (by slug) and listeners (by title, case- and space-insensitive)', () => {
    const scores = scoreShows(
      [
        { keyType: 'slug', key: 'fast-lane', people: 26 },
        { keyType: 'title', key: ' fast lane ', people: 12 },
        { keyType: 'slug', key: '21-grams', people: 11 },
        { keyType: 'title', key: '21 Grams - The Weight of a Soul', people: 4 },
      ],
      shows,
    )
    expect(scores.get(1)).toBe(38)
    expect(scores.get(2)).toBe(15)
  })

  it('gives 0 to a show with no traffic, so an old score is cleared', () => {
    expect(scoreShows([], shows).get(3)).toBe(0)
  })

  it('ignores keys that match no show', () => {
    const scores = scoreShows([{ keyType: 'slug', key: 'deleted-show', people: 50 }], shows)
    expect([...scores.values()]).toEqual([0, 0, 0])
  })
})

describe('parseEndpointResponse', () => {
  it('reads HogQL array rows by column name', () => {
    expect(
      parseEndpointResponse({ columns: ['key', 'people', 'key_type'], results: [['fast-lane', 26, 'slug']] }),
    ).toEqual([{ keyType: 'slug', key: 'fast-lane', people: 26 }])
  })

  it('reads object rows', () => {
    expect(parseEndpointResponse({ results: [{ key_type: 'title', key: 'Gargoyle', people: 8 }] })).toEqual([
      { keyType: 'title', key: 'Gargoyle', people: 8 },
    ])
  })

  it('throws on a response without results rather than zeroing every show', () => {
    expect(() => parseEndpointResponse({ error: 'unauthorized' })).toThrow(/no results/)
  })
})
