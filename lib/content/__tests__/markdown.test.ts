import { describe, expect, it } from 'vitest'
import { blocksToText, parseInline, parseMarkdown, plainText } from '@/lib/content/markdown'

describe('parseInline', () => {
  it('reads bold and links, and keeps plain text around them', () => {
    expect(parseInline('A **bold** word and [a show](/shows/ignite).')).toEqual([
      { kind: 'text', text: 'A ' },
      { kind: 'bold', children: [{ kind: 'text', text: 'bold' }] },
      { kind: 'text', text: ' word and ' },
      { kind: 'link', href: '/shows/ignite', children: [{ kind: 'text', text: 'a show' }] },
      { kind: 'text', text: '.' },
    ])
  })

  it('reads a link inside bold', () => {
    const [bold] = parseInline('**[Ignite](/shows/ignite).** Fireworks.')
    expect(bold).toEqual({
      kind: 'bold',
      children: [
        { kind: 'link', href: '/shows/ignite', children: [{ kind: 'text', text: 'Ignite' }] },
        { kind: 'text', text: '.' },
      ],
    })
  })

  it('keeps the text of a link whose target is not a site path or http(s) URL', () => {
    expect(parseInline('[click](javascript:alert(1))')[0]).toEqual({ kind: 'text', text: 'click' })
    expect(parseInline('[x](//evil.example)')[0]).toEqual({ kind: 'text', text: 'x' })
  })

  it('gives the visible words back as plain text', () => {
    expect(plainText(parseInline('A **bold** [link](/x) here'))).toBe('A bold link here')
  })
})

describe('parseMarkdown', () => {
  it('reads headings with stable ids, dropping a leading number', () => {
    const blocks = parseMarkdown('## 3. Make a cut track\n\ntext\n\n### Notes\n\n## Notes')
    expect(blocks.filter((b) => b.kind === 'heading')).toEqual([
      { kind: 'heading', level: 2, text: '3. Make a cut track', id: 'make-a-cut-track' },
      { kind: 'heading', level: 3, text: 'Notes', id: 'notes' },
      { kind: 'heading', level: 2, text: 'Notes', id: 'notes-2' },
    ])
  })

  it('joins wrapped lines into one paragraph and splits on blank lines', () => {
    const blocks = parseMarkdown('One\ntwo.\n\nThree.')
    expect(blocks.map((b) => (b.kind === 'paragraph' ? plainText(b.inline) : b.kind))).toEqual(['One two.', 'Three.'])
  })

  it('reads bullet and numbered lists as separate blocks', () => {
    const blocks = parseMarkdown('- a\n- b\n\n1. one\n2. two\n3. three')
    expect(blocks).toMatchObject([
      { kind: 'list', ordered: false, items: [[{ text: 'a' }], [{ text: 'b' }]] },
      { kind: 'list', ordered: true },
    ])
    expect(blocks[1].kind === 'list' && blocks[1].items.length).toBe(3)
  })

  it('reads a pipe table', () => {
    const [table] = parseMarkdown('| Circuit | Length |\n|---|---|\n| BOA | 6 to 11 |\n| UIL | 5 to 8 |')
    expect(table.kind).toBe('table')
    if (table.kind !== 'table') return
    expect(table.head.map(plainText)).toEqual(['Circuit', 'Length'])
    expect(table.rows.map((row) => row.map(plainText))).toEqual([['BOA', '6 to 11'], ['UIL', '5 to 8']])
  })

  it('reads a figure with and without a caption', () => {
    expect(parseMarkdown('![Alt text](fig.svg "The caption.")\n\n![Bare](../other/fig.svg)')).toEqual([
      { kind: 'figure', alt: 'Alt text', src: 'fig.svg', caption: 'The caption.' },
      { kind: 'figure', alt: 'Bare', src: '../other/fig.svg', caption: '' },
    ])
  })

  it('drops HTML comments, so a note to the owners never renders', () => {
    const blocks = parseMarkdown('Shown.\n\n<!-- Note to owners\nnot for publication -->\n')
    expect(blocksToText(blocks)).toBe('Shown.')
  })
})
