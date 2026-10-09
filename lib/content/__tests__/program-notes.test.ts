import { describe, expect, it } from 'vitest'
import { parseProgramNotes } from '@/lib/content/program-notes'

const NOTES = `A wolf-pack show written for Ola High School (2025); Intermediate, about 7:30.

The music
- Part 1 (opener): Hungry Like the Wolf (Duran Duran). Sets the pack running.
- Part 2 (ballad): Wolf Totem (The HU). The pack at rest.

Who it suits
Bands of 40 to 90 winds with a full battery and front ensemble.

What you get
Winds, percussion, sound design files and the show graphic.`

describe('parseProgramNotes', () => {
  it('splits into sections with paragraphs and bullets', () => {
    const notes = parseProgramNotes(NOTES)
    expect(notes.sections.map((s) => s.heading)).toEqual([null, 'The music', 'Who it suits', 'What you get'])
    expect(notes.sections[1].blocks[0]).toEqual({ kind: 'ul', items: ['Part 1 (opener): Hungry Like the Wolf (Duran Duran). Sets the pack running.', 'Part 2 (ballad): Wolf Totem (The HU). The pack at rest.'] })
    expect(notes.sections[2].blocks[0]).toEqual({ kind: 'p', text: 'Bands of 40 to 90 winds with a full battery and front ensemble.' })
  })
  it('counts words and takes the first paragraph as summary', () => {
    const notes = parseProgramNotes(NOTES)
    expect(notes.wordCount).toBeGreaterThan(40)
    expect(notes.summary).toBe('A wolf-pack show written for Ola High School (2025); Intermediate, about 7:30.')
  })
  it('returns an empty structure for null', () => {
    expect(parseProgramNotes(null)).toEqual({ sections: [], wordCount: 0, summary: '' })
  })
  it('first line is never a heading', () => {
    const notes = parseProgramNotes('Short title\n\nBody text.')
    expect(notes.sections).toHaveLength(1)
    expect(notes.sections[0].heading).toBe(null)
    expect(notes.sections[0].blocks[0]).toEqual({ kind: 'p', text: 'Short title' })
  })
  it('CRLF input parses the same as LF', () => {
    const lf = parseProgramNotes('First\n\nSecond')
    const crlf = parseProgramNotes('First\r\n\r\nSecond')
    expect(crlf).toEqual(lf)
  })
  it('whitespace-only input returns empty structure', () => {
    expect(parseProgramNotes('   \n\n  \t  ')).toEqual({ sections: [], wordCount: 0, summary: '' })
  })
  it('heading-looking line as last line is a paragraph', () => {
    const notes = parseProgramNotes('Body text.\n\nShort heading')
    expect(notes.sections).toHaveLength(1)
    expect(notes.sections[0].heading).toBe(null)
    expect(notes.sections[0].blocks[1]).toEqual({ kind: 'p', text: 'Short heading' })
  })
  it('summary cuts at sentence end within 300 chars', () => {
    const twoSentences = 'First sentence. ' + 'x'.repeat(300) + ' Second sentence that is much longer and goes on and on to make sure we have enough text here to test that we cut at the first sentence end.'
    const notes = parseProgramNotes(twoSentences)
    expect(notes.summary).toBe('First sentence.')
  })
  it('summary without sentence end within 300 chars appends ellipsis', () => {
    const longSentence = 'A'.repeat(350)
    const notes = parseProgramNotes(longSentence)
    expect(notes.summary.length).toBeLessThanOrEqual(301)
    expect(notes.summary).toMatch(/…$/)
  })
})
