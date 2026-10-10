import { describe, expect, it } from 'vitest'
import { showTitle, arrangementTitle } from '@/lib/seo/titles'

describe('showTitle', () => {
  it('carries difficulty and year', () => {
    expect(showTitle({ title: 'Ride the Wave', difficulty: 'Beginner', year: 2025 }))
      .toBe('Ride the Wave – Beginner Marching Band Show (2025) | Bright Designs')
  })
  it('omits missing parts', () => {
    expect(showTitle({ title: 'Apex', difficulty: null, year: null })).toBe('Apex – Marching Band Show | Bright Designs')
  })
  it('drops the brand when the title would pass 60 characters', () => {
    expect(showTitle({ title: 'Spices, Perfumes & Toxins', difficulty: 'Advanced', year: 2024 }))
      .toBe('Spices, Perfumes & Toxins – Advanced Marching Band Show (2024)')
  })
})

describe('arrangementTitle', () => {
  it('names the piece as a marching band arrangement', () => {
    expect(arrangementTitle({ title: 'Pipeline', composer: 'The Chantays' }))
      .toBe('Pipeline (The Chantays) – Marching Band Arrangement | Bright Designs')
    expect(arrangementTitle({ title: 'Pipeline', composer: null })).toBe('Pipeline – Marching Band Arrangement | Bright Designs')
  })
})
