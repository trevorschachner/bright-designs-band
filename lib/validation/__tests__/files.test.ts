import { describe, it, expect } from 'vitest'
import {
  buildUploadPath,
  displayFileName,
  extensionForMime,
  isAllowedMime,
  MIME_EXTENSIONS,
  signUploadSchema,
  UPLOAD_KINDS,
  UPLOAD_MIME_TYPES,
  UPLOAD_SIZE_LIMITS,
} from '../files'

const MB = 1024 * 1024
const ID = '0b7c6f0e-3c2a-4b8e-9d4f-1a2b3c4d5e6f'

const sign = (overrides: Record<string, unknown> = {}) =>
  signUploadSchema.safeParse({
    showId: 7,
    fileName: 'Opener.mp3',
    mimeType: 'audio/mpeg',
    size: 1000,
    kind: 'audio',
    isPublic: true,
    ...overrides,
  })

describe('upload limits per kind', () => {
  it('image 10 MB, audio 100 MB, score 50 MB, other 100 MB', () => {
    expect(UPLOAD_SIZE_LIMITS).toEqual({ image: 10 * MB, audio: 100 * MB, score: 50 * MB, other: 100 * MB })
  })

  it('accepts a file at the limit and rejects one byte over', () => {
    for (const kind of UPLOAD_KINDS) {
      const mimeType = UPLOAD_MIME_TYPES[kind][0]
      expect(sign({ kind, mimeType, size: UPLOAD_SIZE_LIMITS[kind] }).success).toBe(true)
      const over = sign({ kind, mimeType, size: UPLOAD_SIZE_LIMITS[kind] + 1 })
      expect(over.success).toBe(false)
      expect(over.error?.issues.map((i) => i.path.join('.'))).toContain('size')
    }
  })

  it('rejects an empty file and a non-integer size', () => {
    expect(sign({ size: 0 }).success).toBe(false)
    expect(sign({ size: 1.5 }).success).toBe(false)
  })

  it('accepts audio/ogg as audio', () => {
    expect(sign({ mimeType: 'audio/ogg' }).success).toBe(true)
  })

  it('rejects a MIME type that is not allowed for the kind, and any unknown type', () => {
    expect(sign({ kind: 'image', mimeType: 'application/pdf' }).success).toBe(false)
    expect(sign({ kind: 'other', mimeType: 'text/html' }).success).toBe(false)
    expect(sign({ kind: 'other', mimeType: 'application/octet-stream' }).success).toBe(false)
    expect(sign({ kind: 'image', mimeType: 'image/svg+xml' }).success).toBe(false)
    expect(sign({ kind: 'other', mimeType: 'application/javascript' }).success).toBe(false)
  })

  it('is strict, and needs a show for a part upload', () => {
    expect(sign({ storagePath: 'x' }).success).toBe(false)
    expect(sign({ fileSize: 1 }).success).toBe(false)
    expect(sign({ showId: undefined, arrangementId: 3 }).success).toBe(false)
    expect(sign({ kind: 'pdf' }).success).toBe(false)
  })
})

describe('MIME → extension allowlist', () => {
  it('maps every allowed MIME type of every kind to an extension', () => {
    for (const kind of UPLOAD_KINDS) {
      for (const mime of UPLOAD_MIME_TYPES[kind]) {
        expect(extensionForMime(mime), mime).toMatch(/^[a-z0-9]+$/)
        expect(isAllowedMime(kind, mime)).toBe(true)
      }
    }
  })

  it('known types', () => {
    expect(extensionForMime('image/jpeg')).toBe('jpg')
    expect(extensionForMime('audio/mpeg')).toBe('mp3')
    expect(extensionForMime('audio/ogg')).toBe('ogg')
    expect(extensionForMime('application/pdf')).toBe('pdf')
    expect(extensionForMime('Text/Plain; charset=utf-8')).toBe('txt')
  })

  it('unknown types have no extension', () => {
    expect(extensionForMime('text/html')).toBeNull()
    expect(extensionForMime('')).toBeNull()
    expect(Object.values(MIME_EXTENSIONS)).not.toContain('html')
  })
})

describe('buildUploadPath', () => {
  it('show, part and resource shapes, extension from the MIME type', () => {
    expect(buildUploadPath({ showId: 7, kind: 'image', mimeType: 'image/png', id: ID })).toBe(`shows/7/image/${ID}.png`)
    expect(buildUploadPath({ showId: 7, arrangementId: 3, kind: 'audio', mimeType: 'audio/mpeg', id: ID })).toBe(
      `shows/7/arrangements/3/audio/${ID}.mp3`
    )
    expect(buildUploadPath({ kind: 'other', mimeType: 'application/pdf', id: ID })).toBe(`resources/other/${ID}.pdf`)
  })

  it('refuses a non-uuid id (so no name can reach the path), odd ids and unknown MIME types', () => {
    expect(() => buildUploadPath({ showId: 7, kind: 'image', mimeType: 'image/png', id: '../../etc/passwd' })).toThrow()
    expect(() => buildUploadPath({ showId: 7, kind: 'image', mimeType: 'image/png', id: 'a/b' })).toThrow()
    expect(() => buildUploadPath({ showId: -1, kind: 'image', mimeType: 'image/png', id: ID })).toThrow()
    expect(() => buildUploadPath({ showId: 1.5, kind: 'image', mimeType: 'image/png', id: ID })).toThrow()
    expect(() => buildUploadPath({ arrangementId: 3, kind: 'image', mimeType: 'image/png', id: ID })).toThrow()
    expect(() => buildUploadPath({ showId: 7, kind: 'image', mimeType: 'text/html', id: ID })).toThrow()
  })
})

describe('displayFileName (display only, never a path)', () => {
  it('drops directories and control characters', () => {
    expect(displayFileName('../../etc/passwd')).toBe('passwd')
    expect(displayFileName('C:\\Users\\x\\Opener.mp3')).toBe('Opener.mp3')
    expect(displayFileName('bad\u0000name\n.pdf')).toBe('badname.pdf')
  })

  it('falls back for names with nothing left', () => {
    expect(displayFileName('..')).toBe('upload')
    expect(displayFileName('a/')).toBe('upload')
    expect(displayFileName('   ')).toBe('upload')
  })

  it('caps the length', () => {
    expect(displayFileName('x'.repeat(500))).toHaveLength(200)
  })
})
