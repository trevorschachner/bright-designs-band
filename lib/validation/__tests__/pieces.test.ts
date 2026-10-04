import { describe, expect, it } from 'vitest'
import { getTableColumns } from 'drizzle-orm'
import { pieces } from '@/lib/database/schema'
import { arrangementPiecesInputSchema, pieceInputSchema } from '../pieces'

describe('pieceInputSchema', () => {
  it('accepts only keys that are real columns', () => {
    const columns = Object.keys(getTableColumns(pieces))
    expect(Object.keys(pieceInputSchema.shape).filter(k => !columns.includes(k))).toEqual([])
  })

  it('trims the title and requires one', () => {
    expect(pieceInputSchema.parse({ title: '  Libertango ' }).title).toBe('Libertango')
    expect(pieceInputSchema.safeParse({ title: '   ' }).success).toBe(false)
    expect(pieceInputSchema.safeParse({}).success).toBe(false)
  })

  it('turns blank optional text into null', () => {
    const parsed = pieceInputSchema.parse({ title: 'X', composer: '  ', licensingStatus: '' })
    expect(parsed.composer).toBeNull()
    expect(parsed.licensingStatus).toBeNull()
  })

  it('normalises the copyright amount to the numeric string form', () => {
    expect(pieceInputSchema.parse({ title: 'X', copyrightAmountUsd: 250 }).copyrightAmountUsd).toBe('250')
    expect(pieceInputSchema.parse({ title: 'X', copyrightAmountUsd: '99.5' }).copyrightAmountUsd).toBe('99.5')
    expect(pieceInputSchema.parse({ title: 'X', copyrightAmountUsd: '' }).copyrightAmountUsd).toBeNull()
    expect(pieceInputSchema.parse({ title: 'X', copyrightAmountUsd: null }).copyrightAmountUsd).toBeNull()
  })

  it('rejects amounts that do not fit numeric(10,2)', () => {
    expect(pieceInputSchema.safeParse({ title: 'X', copyrightAmountUsd: '1.234' }).success).toBe(false)
    expect(pieceInputSchema.safeParse({ title: 'X', copyrightAmountUsd: '123456789' }).success).toBe(false)
    expect(pieceInputSchema.safeParse({ title: 'X', copyrightAmountUsd: 'ten' }).success).toBe(false)
  })

  it('strips unknown keys so they cannot reach the insert', () => {
    const parsed = pieceInputSchema.parse({ title: 'X', id: 9, createdAt: 'yesterday' })
    expect('id' in parsed).toBe(false)
    expect('createdAt' in parsed).toBe(false)
  })
})

describe('arrangementPiecesInputSchema', () => {
  it('accepts an ordered list of ids, including an empty one', () => {
    expect(arrangementPiecesInputSchema.parse({ pieceIds: [3, 1, 2] }).pieceIds).toEqual([3, 1, 2])
    expect(arrangementPiecesInputSchema.parse({ pieceIds: [] }).pieceIds).toEqual([])
  })

  it('rejects duplicates, non-integers and a missing list', () => {
    expect(arrangementPiecesInputSchema.safeParse({ pieceIds: [1, 1] }).success).toBe(false)
    expect(arrangementPiecesInputSchema.safeParse({ pieceIds: [1.5] }).success).toBe(false)
    expect(arrangementPiecesInputSchema.safeParse({ pieceIds: [0] }).success).toBe(false)
    expect(arrangementPiecesInputSchema.safeParse({}).success).toBe(false)
  })
})
