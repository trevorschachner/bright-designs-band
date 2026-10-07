import { describe, expect, it } from 'vitest'
import { formatPiece, piecesToCredit } from '../credits'

describe('formatPiece', () => {
  it('adds the composer in parentheses', () => {
    expect(formatPiece({ title: 'Libertango', composer: 'Astor Piazzolla' })).toBe('Libertango (Astor Piazzolla)')
  })

  it('leaves the composer out when blank', () => {
    expect(formatPiece({ title: 'Libertango', composer: null })).toBe('Libertango')
    expect(formatPiece({ title: 'Libertango', composer: '  ' })).toBe('Libertango')
  })
})

describe('piecesToCredit', () => {
  const libertango = { title: 'Libertango', composer: 'Astor Piazzolla' }
  const redline = { title: 'Redline Tango', composer: 'John Mackey' }

  it('credits every piece of a medley, in order', () => {
    const part = { title: 'Tango Medley', composer: null }
    expect(piecesToCredit(part, [libertango, redline])).toEqual([libertango, redline])
  })

  it('credits a single piece whose title differs from the part', () => {
    const part = { title: 'Part 1', composer: null }
    expect(piecesToCredit(part, [libertango])).toEqual([libertango])
  })

  it('hides a single piece that repeats the part title and composer', () => {
    const part = { title: ' libertango ', composer: 'Astor Piazzolla' }
    expect(piecesToCredit(part, [libertango])).toEqual([])
  })

  it('keeps a same-titled piece when it adds a composer the part lacks', () => {
    const part = { title: 'Libertango', composer: null }
    expect(piecesToCredit(part, [libertango])).toEqual([libertango])
  })

  it('returns nothing for a part with no pieces', () => {
    expect(piecesToCredit({ title: 'Part 1', composer: null }, [])).toEqual([])
  })
})
