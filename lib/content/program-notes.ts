export type NoteBlock = { kind: 'p'; text: string } | { kind: 'ul'; items: string[] }
export type NoteSection = { heading: string | null; blocks: NoteBlock[] }
export type ProgramNotes = { sections: NoteSection[]; wordCount: number; summary: string }

const EMPTY: ProgramNotes = { sections: [], wordCount: 0, summary: '' }

/** A short line with no terminal punctuation, on its own, is a heading. */
function isHeading(line: string, next: string | undefined): boolean {
  return line.length <= 40 && !/[.!?:]$/.test(line) && !line.startsWith('- ') && next !== undefined && next.trim() !== ''
}

export function parseProgramNotes(text: string | null | undefined): ProgramNotes {
  const raw = (text ?? '').replace(/\r\n/g, '\n').trim()
  if (!raw) return EMPTY
  const lines = raw.split('\n').map((l) => l.trimEnd())
  const sections: NoteSection[] = [{ heading: null, blocks: [] }]
  let para: string[] = []
  let list: string[] = []
  const flush = () => {
    const current = sections[sections.length - 1]
    if (para.length) current.blocks.push({ kind: 'p', text: para.join(' ').trim() })
    if (list.length) current.blocks.push({ kind: 'ul', items: list })
    para = []; list = []
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) { flush(); continue }
    if (line.startsWith('- ')) { if (para.length) flush(); list.push(line.slice(2).trim()); continue }
    if (list.length) flush()
    if (para.length === 0 && isHeading(line, lines[i + 1]) && (i === 0 ? false : lines[i - 1].trim() === '')) {
      sections.push({ heading: line, blocks: [] }); continue
    }
    para.push(line)
  }
  flush()
  const kept = sections.filter((s) => s.heading !== null || s.blocks.length > 0)
  const words = raw.split(/\s+/).filter(Boolean).length
  const first = kept[0]?.blocks.find((b) => b.kind === 'p')
  const summary = first && first.kind === 'p' ? (first.text.length > 300 ? first.text.slice(0, 300).replace(/\s+\S*$/, '') : first.text) : ''
  return { sections: kept, wordCount: words, summary }
}
