import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { showArt, toPublicUrl } from '../show-art'

const ENV_KEYS = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_STORAGE_BUCKET', 'NEXT_PUBLIC_STORAGE_ROOT_PREFIX', 'NETLIFY'] as const
const ORIGINAL = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]))

// Stored values look like this (every graphic_url, thumbnail_url and image files.url).
const stored = (name: string) => `https://x.supabase.co/storage/v1/object/public/Bright%20Designs/files/shows/1/image/${name}`

describe('showArt', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
    delete process.env.NEXT_PUBLIC_STORAGE_BUCKET
    delete process.env.NEXT_PUBLIC_STORAGE_ROOT_PREFIX
    delete process.env.NETLIFY
  })
  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (ORIGINAL[k] === undefined) delete process.env[k]
      else process.env[k] = ORIGINAL[k]
    }
  })

  it('prefers the graphic, then the thumbnail, then the first image file', () => {
    const graphicUrl = stored('g.webp')
    const thumbnailUrl = stored('t.webp')
    const imageUrl = stored('f.webp')
    expect(showArt({ graphicUrl, thumbnailUrl, imageUrl })).toBe(graphicUrl)
    expect(showArt({ graphicUrl: null, thumbnailUrl, imageUrl })).toBe(thumbnailUrl)
    expect(showArt({ graphicUrl: null, thumbnailUrl: null, imageUrl })).toBe(imageUrl)
  })

  it('is null for a show with no art, and for no show', () => {
    expect(showArt({ graphicUrl: null, thumbnailUrl: null, imageUrl: null })).toBeNull()
    expect(showArt({})).toBeNull()
    expect(showArt(null)).toBeNull()
    expect(showArt(undefined)).toBeNull()
  })

  it('skips empty and blank values instead of returning them', () => {
    expect(showArt({ graphicUrl: '', thumbnailUrl: '   ', imageUrl: stored('f.webp') })).toBe(stored('f.webp'))
  })

  it('passes stored public URLs through unchanged', () => {
    expect(showArt({ graphicUrl: stored('a b.png') })).toBe(stored('a b.png'))
    expect(showArt({ thumbnailUrl: 'http://example.com/t.png' })).toBe('http://example.com/t.png')
  })

  it('builds the public URL for a bare storage path under the root prefix', () => {
    expect(showArt({ imageUrl: 'shows/1/image/f.webp' })).toBe(stored('f.webp'))
    expect(showArt({ graphicUrl: '/shows/1/image/g.webp' })).toBe(stored('g.webp'))
  })

  it('honours the bucket and root prefix env', () => {
    process.env.NEXT_PUBLIC_STORAGE_BUCKET = 'art'
    process.env.NEXT_PUBLIC_STORAGE_ROOT_PREFIX = '/media/'
    expect(showArt({ graphicUrl: 'shows/1/g.webp' })).toBe('https://x.supabase.co/storage/v1/object/public/art/media/shows/1/g.webp')
  })

  it('falls through a path it cannot resolve (no Supabase URL) to the next candidate', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    expect(toPublicUrl('shows/1/g.webp')).toBeNull()
    expect(showArt({ graphicUrl: 'shows/1/g.webp', imageUrl: stored('f.webp') })).toBe(stored('f.webp'))
  })
})
