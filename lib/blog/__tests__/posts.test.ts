import { describe, expect, it } from 'vitest'
import { CASE_STUDIES, formatDate, getCaseStudyBySlug } from '../posts'

describe('formatDate', () => {
  it('formats a date-only string in UTC regardless of host timezone', () => {
    // '2024-11-01' parses as UTC midnight; formatting in a negative-offset
    // zone rendered the previous day, contradicting the <time dateTime> attr.
    const original = process.env.TZ
    try {
      process.env.TZ = 'America/New_York'
      expect(formatDate('2024-11-01')).toBe('November 1, 2024')
    } finally {
      process.env.TZ = original
    }
  })

  it('formats correctly in a positive-offset zone too', () => {
    expect(formatDate('2024-01-01')).toBe('January 1, 2024')
  })
})

describe('case study content coverage', () => {
  it('gives every case study a resolvable slug', () => {
    for (const study of CASE_STUDIES) {
      expect(getCaseStudyBySlug(study.slug)).toBeDefined()
    }
  })
})
