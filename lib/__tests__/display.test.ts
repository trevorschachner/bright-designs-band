import { describe, it, expect } from 'vitest'
import { clock, difficultyLabel, durationLabel, ensembleLabel, gradeLabel, playerTime } from '@/lib/display'

describe('display', () => {
  it('formats lengths', () => {
    expect(clock(185)).toBe('3:05')
    expect(durationLabel(185)).toBe('3:05')
    expect(durationLabel(0)).toBe('—')
    expect(durationLabel(null)).toBe('—')
    expect(playerTime(NaN)).toBe('0:00')
    expect(playerTime(Infinity)).toBe('0:00')
    expect(playerTime(61.9)).toBe('1:01')
  })

  it('labels grade bands, ensemble sizes and difficulty', () => {
    expect(gradeLabel('1_2')).toBe('Grade 1-2')
    expect(gradeLabel('5_plus')).toBe('Grade 5+')
    expect(gradeLabel(null)).toBeNull()
    expect(ensembleLabel('large')).toBe('Large Ensemble')
    expect(ensembleLabel(undefined)).toBeNull()
    expect(difficultyLabel('Advanced')).toBe('Advanced')
    expect(difficultyLabel(null)).toBe('Not specified')
  })
})
