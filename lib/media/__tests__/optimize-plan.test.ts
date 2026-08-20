import { describe, expect, it } from 'vitest'
import {
  AUDIO_TARGET,
  IMAGE_TARGET,
  REFERENCING_COLUMNS,
  assertSafeIdentifier,
  planFile,
  planUrlRewrites,
  replaceExtension,
  replaceUrlExtension,
  type FileRow,
} from '../optimize-plan'

const imageRow = (over: Partial<FileRow> = {}): FileRow => ({
  id: 12,
  storagePath: 'shows/16/image/1763679075773_ghtxr0sp0eq.png',
  url: 'https://x.supabase.co/storage/v1/object/public/Bright%20Designs/files/shows/16/image/1763679075773_ghtxr0sp0eq.png',
  originalName: 'dot_by_dot_poster.png',
  fileName: '1763679075773_ghtxr0sp0eq.png',
  mimeType: 'image/png',
  fileSize: 9_802_000,
  ...over,
})

describe('replaceExtension', () => {
  it('swaps the trailing extension', () => {
    expect(replaceExtension('shows/16/a.png', 'webp')).toBe('shows/16/a.webp')
  })

  it('is case-insensitive on the source extension', () => {
    expect(replaceExtension('shows/16/a.PNG', 'webp')).toBe('shows/16/a.webp')
  })

  it('only touches the final extension when the name contains dots', () => {
    expect(replaceExtension('Turn It Up! Part 4.wav', 'mp3')).toBe('Turn It Up! Part 4.mp3')
  })

  it('appends when there is no extension at all', () => {
    expect(replaceExtension('poster', 'webp')).toBe('poster.webp')
  })
})

describe('replaceUrlExtension', () => {
  it('preserves percent-encoding elsewhere in the URL', () => {
    expect(replaceUrlExtension(imageRow().url, 'webp')).toBe(
      'https://x.supabase.co/storage/v1/object/public/Bright%20Designs/files/shows/16/image/1763679075773_ghtxr0sp0eq.webp'
    )
  })

  it('leaves a query string and hash intact', () => {
    expect(replaceUrlExtension('https://x/a.png?v=2#top', 'webp')).toBe('https://x/a.webp?v=2#top')
  })
})

describe('planFile', () => {
  it('produces the full set of column updates for a PNG', () => {
    const plan = planFile(imageRow(), IMAGE_TARGET)
    expect(plan).not.toBeNull()
    expect(plan!.newStoragePath).toBe('shows/16/image/1763679075773_ghtxr0sp0eq.webp')
    expect(plan!.newFileName).toBe('1763679075773_ghtxr0sp0eq.webp')
    expect(plan!.newOriginalName).toBe('dot_by_dot_poster.webp')
    expect(plan!.newMimeType).toBe('image/webp')
    expect(plan!.oldStoragePath).toBe(imageRow().storagePath)
  })

  it('maps WAV to audio/mpeg', () => {
    const plan = planFile(
      imageRow({ storagePath: 'shows/2/audio/x.wav', url: 'https://x/x.wav', originalName: 'Turn It Up! Part 4.wav', fileName: 'x.wav', mimeType: 'audio/wav' }),
      AUDIO_TARGET
    )
    expect(plan!.newMimeType).toBe('audio/mpeg')
    expect(plan!.newOriginalName).toBe('Turn It Up! Part 4.mp3')
  })

  it('is idempotent — returns null for an already-optimized row', () => {
    const row = imageRow({ storagePath: 'shows/16/a.webp', url: 'https://x/a.webp' })
    expect(planFile(row, IMAGE_TARGET)).toBeNull()
  })

  it('skips rows whose extension does not match the target', () => {
    const row = imageRow({ storagePath: 'shows/16/a.jpg', url: 'https://x/a.jpg' })
    expect(planFile(row, IMAGE_TARGET)).toBeNull()
  })
})

describe('planUrlRewrites', () => {
  it('covers every column that can reference a storage URL', () => {
    const rewrites = planUrlRewrites('https://x/a.png', 'https://x/a.webp')
    expect(rewrites).toHaveLength(REFERENCING_COLUMNS.length)
    expect(rewrites.map((r) => `${r.table}.${r.column}`)).toEqual([
      'shows.thumbnail_url',
      'shows.graphic_url',
      'shows.video_url',
      'resources.image_url',
      'resources.file_url',
      'arrangements.sample_score_url',
    ])
    expect(rewrites[0].oldValue).toBe('https://x/a.png')
    expect(rewrites[0].newValue).toBe('https://x/a.webp')
  })
})

describe('assertSafeIdentifier', () => {
  it('accepts the identifiers we actually use', () => {
    for (const { table, column } of REFERENCING_COLUMNS) {
      expect(() => assertSafeIdentifier(table)).not.toThrow()
      expect(() => assertSafeIdentifier(column)).not.toThrow()
    }
  })

  it('rejects anything that is not a bare snake_case identifier', () => {
    for (const bad of ['shows; drop table files', 'shows--', 'a b', '"shows"', '', '1shows']) {
      expect(() => assertSafeIdentifier(bad)).toThrow(/unsafe sql identifier/i)
    }
  })

  it('every referencing column passes the guard', () => {
    // Regression guard: if someone adds a column sourced from config or a
    // query, this fails before it can reach an interpolated statement.
    expect(() => planUrlRewrites('https://x/a.png', 'https://x/a.webp')).not.toThrow()
  })
})
