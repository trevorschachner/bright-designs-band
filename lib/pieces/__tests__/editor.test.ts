import { describe, expect, it } from 'vitest'
import { canCreatePiece, moveItem, suggestPieces } from '../editor'

const all = [
  { id: 1, title: 'Libertango', composer: 'Astor Piazzolla' },
  { id: 2, title: 'Redline Tango', composer: 'John Mackey' },
  { id: 3, title: 'Oblivion', composer: 'Astor Piazzolla' },
]

describe('moveItem', () => {
  it('moves up and down', () => {
    expect(moveItem(['a', 'b', 'c'], 2, -1)).toEqual(['a', 'c', 'b'])
    expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c'])
  })

  it('ignores moves off either end and leaves the input alone', () => {
    const input = ['a', 'b']
    expect(moveItem(input, 0, -1)).toEqual(['a', 'b'])
    expect(moveItem(input, 1, 1)).toEqual(['a', 'b'])
    expect(input).toEqual(['a', 'b'])
  })
})

describe('suggestPieces', () => {
  it('offers nothing for an empty query', () => {
    expect(suggestPieces(all, [], '  ')).toEqual([])
  })

  it('matches title before composer and skips pieces already linked', () => {
    expect(suggestPieces(all, [], 'tango').map(p => p.id)).toEqual([1, 2])
    expect(suggestPieces(all, [1], 'piazzolla').map(p => p.id)).toEqual([3])
  })
})

describe('canCreatePiece', () => {
  it('allows a new title and blocks an exact existing one', () => {
    expect(canCreatePiece(all, 'Adios Nonino')).toBe(true)
    expect(canCreatePiece(all, ' libertango ')).toBe(false)
    expect(canCreatePiece(all, '')).toBe(false)
  })
})
