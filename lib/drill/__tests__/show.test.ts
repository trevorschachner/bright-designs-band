import { describe, expect, it } from 'vitest'
import { COUNT_SECONDS, HOLD_COUNTS, LOOP_SECONDS, MOVE_COUNTS, PERFORMERS, SETS, positionsAt } from '@/lib/drill/show'

const MOVE = MOVE_COUNTS * COUNT_SECONDS
const SEGMENT = MOVE + HOLD_COUNTS * COUNT_SECONDS
const spotsKey = (spots: readonly (readonly number[])[]) =>
  spots.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).sort().join('|')

describe('background drill', () => {
  it('has every performer in every set, inside a 30 x 14 field', () => {
    for (const set of SETS) {
      expect(set).toHaveLength(PERFORMERS)
      for (const [x, y] of set) {
        expect(Math.abs(x)).toBeLessThanOrEqual(15)
        expect(Math.abs(y)).toBeLessThanOrEqual(7)
      }
    }
  })

  it('holds each set for 4 counts after its 8-count move', () => {
    for (let i = 1; i < SETS.length; i++) {
      const end = (i - 1) * SEGMENT
      for (const t of [end + MOVE, end + SEGMENT - 0.01]) {
        positionsAt(t).forEach(([x, y], p) => {
          expect(x).toBeCloseTo(SETS[i][p][0])
          expect(y).toBeCloseTo(SETS[i][p][1])
        })
      }
    }
  })

  it('never lets two performers touch, on a set or mid-move', () => {
    let closest = Infinity
    for (let t = 0; t < LOOP_SECONDS; t += 0.05) {
      const s = positionsAt(t)
      for (let i = 0; i < s.length; i++)
        for (let j = i + 1; j < s.length; j++) closest = Math.min(closest, Math.hypot(s[i][0] - s[j][0], s[i][1] - s[j][1]))
    }
    expect(closest).toBeGreaterThan(0.35)
  })

  it('moves without jumps: no performer travels more than a fifth of a square in 1/20 s', () => {
    // Up to the seam: there the same spots are re-labelled (checked below), which draws identically.
    for (let t = 0; t + 0.05 < LOOP_SECONDS - 0.01; t += 0.05) {
      const a = positionsAt(t)
      const b = positionsAt(t + 0.05)
      a.forEach(([x, y], p) => expect(Math.hypot(b[p][0] - x, b[p][1] - y)).toBeLessThan(0.2))
    }
  })

  it('ends on the spots it starts from, so the loop is seamless', () => {
    expect(spotsKey(SETS[SETS.length - 1])).toBe(spotsKey(SETS[0]))
  })
})
