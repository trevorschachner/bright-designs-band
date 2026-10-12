import { describe, expect, it } from 'vitest'
import { dropDrill, rewriteDrill } from '../apply-owner-answers'

describe('rewriteDrill', () => {
  it.each([
    ['Drill for Gilbert was written by Nicole Davis and can be adapted to your numbers.', 'Drill is not included; the original drill for Gilbert was written by Nicole Davis.'],
    ['Drill and program coordination for Columbine were by Hunter Dugie, and the drill can be adapted to your numbers.', 'Drill is not included; the original drill and program coordination for Columbine were by Hunter Dugie.'],
    ['Drill and program coordination for the original season were by Harrison Thornton, and the drill can be adapted to your floor.', 'Drill is not included; the original drill and program coordination were by Harrison Thornton.'],
    ['Drill was written by Richard Hinshaw and can be adapted to your numbers; program coordination was by Trevor Schachner.', 'Drill is not included; the original drill was written by Richard Hinshaw; program coordination was by Trevor Schachner.'],
  ])('%s', (input, expected) => {
    expect(rewriteDrill(input)).toBe(expected)
  })
  it('is idempotent and leaves other text alone', () => {
    const once = rewriteDrill('Parts can be swapped. Drill for Lexington was written by Aaron Stickley and can be adapted to your numbers.')
    expect(rewriteDrill(once)).toBe(once)
    expect(once.startsWith('Parts can be swapped. ')).toBe(true)
  })
})

describe('dropDrill', () => {
  it('removes only drill', () => {
    expect(dropDrill('winds, percussion, sound design, drill, graphic')).toBe('winds, percussion, sound design, graphic')
    expect(dropDrill('drill')).toBe('')
    expect(dropDrill('winds, graphic')).toBe('winds, graphic')
  })
})
