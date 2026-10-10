import { describe, expect, it } from 'vitest'
import { showFaqs } from '@/lib/seo/show-faq'
import { parseProgramNotes } from '@/lib/content/program-notes'

const notes = parseProgramNotes(`A wolf-pack show for Ola High School (2025).\n\nWho it suits\nBands of 40 to 90 winds.\n\nWhat you get\nWinds, percussion and sound design.`)
const parts = [
  { title: 'Hungry Like the Wolf', scene: 'Opener', pieces: ['Hungry Like the Wolf (Duran Duran)'] },
  { title: 'Wolf Totem', scene: 'Ballad', pieces: ['Wolf Totem (The HU)'] },
]

describe('showFaqs', () => {
  it('answers what, which music, and who for', () => {
    const faqs = showFaqs({ title: 'Apex', difficulty: 'Intermediate', duration: '7:30', ensembleSize: 'medium', year: 2025, commissioned: 'Ola High School' }, notes, parts)
    expect(faqs.map((f) => f.question)).toEqual(['What is Apex about?', 'What music is in Apex?', 'Who is Apex for?'])
    expect(faqs[1].answer).toContain('Hungry Like the Wolf (Duran Duran)')
    expect(faqs[2].answer).toContain('40 to 90 winds')
  })
  it('returns nothing without notes or parts', () => {
    expect(showFaqs({ title: 'X', difficulty: null, duration: null, ensembleSize: null, year: null, commissioned: null }, parseProgramNotes(null), [])).toEqual([])
  })
})
