import { describe, it, expect } from 'vitest'
import { clock, difficultyLabel, durationLabel, ensembleLabel, gradeLabel, leadSentences, playerTime } from '@/lib/display'

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

describe('leadSentences', () => {
  it('keeps a long first sentence whole and drops the rest', () => {
    expect(leadSentences('Drawn to Life tells the story of an artist who brings an entire world into existence. As they sketch, it grows.'))
      .toBe('Drawn to Life tells the story of an artist who brings an entire world into existence.')
  })
  it('adds sentences until the lead is long enough', () => {
    expect(leadSentences('Jump into the world of the Caterpillar! From crawling, to eating, to turning into a butterfly, the audience will love it. More.'))
      .toBe('Jump into the world of the Caterpillar! From crawling, to eating, to turning into a butterfly, the audience will love it.')
  })
  it('does not split inside a word with a period', () => {
    expect(leadSentences('Featuring Mr.Magorium and friends in a show that runs long enough to pass the minimum length easily. Second.'))
      .toBe('Featuring Mr.Magorium and friends in a show that runs long enough to pass the minimum length easily.')
  })
  it('turns a typed --- into a dash', () => {
    expect(leadSentences('Crawling, eating, turning into a butterfly --- the audience will love this explosion of life and color.'))
      .toBe('Crawling, eating, turning into a butterfly — the audience will love this explosion of life and color.')
  })
  it('returns text without an ending whole, and empty for nothing', () => {
    expect(leadSentences('A show with no full stop')).toBe('A show with no full stop')
    expect(leadSentences(null)).toBe('')
  })
})
