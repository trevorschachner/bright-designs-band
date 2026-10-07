import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { publicStorageUrl } from '../public-url'

const ORIGINAL = process.env.NEXT_PUBLIC_SUPABASE_URL

describe('publicStorageUrl', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
  })
  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
    else process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGINAL
  })

  it('builds nested paths', () => {
    expect(publicStorageUrl('bucket', 'files/shows/1/a.mp3')).toBe(
      'https://x.supabase.co/storage/v1/object/public/bucket/files/shows/1/a.mp3'
    )
  })

  it('encodes each segment (spaces, #, ?, unicode) but keeps separators', () => {
    expect(publicStorageUrl('Bright Designs', 'files/a b/c#d?e/café.png')).toBe(
      'https://x.supabase.co/storage/v1/object/public/Bright%20Designs/files/a%20b/c%23d%3Fe/caf%C3%A9.png'
    )
  })

  it('strips leading and trailing slashes without double slashes', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co/'
    expect(publicStorageUrl('b', '/files//a.png/')).toBe(
      'https://x.supabase.co/storage/v1/object/public/b/files/a.png'
    )
  })

  it('throws when the env var is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    expect(() => publicStorageUrl('b', 'a.png')).toThrow('NEXT_PUBLIC_SUPABASE_URL is not set')
  })

  it('throws when the env var is masked', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = '****'
    expect(() => publicStorageUrl('b', 'a.png')).toThrow('NEXT_PUBLIC_SUPABASE_URL is not set')
  })
})
