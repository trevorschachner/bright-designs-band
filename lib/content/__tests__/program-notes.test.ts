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
})
