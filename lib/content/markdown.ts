/**
 * The small Markdown subset articles are written in (content/articles/*.md):
 * `##` and `###` headings, paragraphs, `- ` and `1. ` lists, pipe tables,
 * a figure on its own line (`![alt](src "caption")`), and inline `**bold**`
 * and `[text](href)`. Pure: no file access, no HTML output. The page renders
 * the blocks as React elements, so article text is never injected as HTML.
 */

export type Inline =
  | { kind: 'text'; text: string }
  | { kind: 'bold'; children: Inline[] }
  | { kind: 'link'; href: string; children: Inline[] }

export type Block =
  | { kind: 'heading'; level: 2 | 3; text: string; id: string }
  | { kind: 'paragraph'; inline: Inline[] }
  | { kind: 'list'; ordered: boolean; items: Inline[][] }
  | { kind: 'table'; head: Inline[][]; rows: Inline[][][] }
  | { kind: 'figure'; src: string; alt: string; caption: string }

const INLINE = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g

/** Only site paths and http(s) links become links; anything else stays text. */
function safeHref(href: string): boolean {
  return /^(\/(?!\/)|https?:\/\/|mailto:)/.test(href)
}

export function parseInline(text: string): Inline[] {
  const out: Inline[] = []
  let last = 0
  for (const match of text.matchAll(INLINE)) {
    const start = match.index ?? 0
    if (start > last) out.push({ kind: 'text', text: text.slice(last, start) })
    if (match[1] !== undefined) {
      out.push({ kind: 'bold', children: parseInline(match[1]) })
    } else if (safeHref(match[3])) {
      out.push({ kind: 'link', href: match[3], children: parseInline(match[2]) })
    } else {
      out.push({ kind: 'text', text: match[2] })
    }
    last = start + match[0].length
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) })
  return out
}

/** The words a reader sees: markup dropped, link text and bold text kept. */
export function plainText(inline: Inline[]): string {
  return inline.map((node) => (node.kind === 'text' ? node.text : plainText(node.children))).join('')
}

/** `## 3. Make a cut track` becomes `make-a-cut-track`; repeats get `-2`, `-3`. */
function headingId(text: string, used: Map<string, number>): string {
  const base =
    text
      .toLowerCase()
      .replace(/^\d+\.\s*/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section'
  const count = (used.get(base) ?? 0) + 1
  used.set(base, count)
  return count === 1 ? base : `${base}-${count}`
}

const FIGURE = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/
const cells = (row: string) => row.replace(/^\||\|$/g, '').split('|').map((cell) => parseInline(cell.trim()))
const isTableRule = (row: string) => /^\|?[\s:|-]+\|?$/.test(row) && row.includes('-')

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n/g, '\n').replace(/<!--[\s\S]*?-->/g, '').split('\n')
  const blocks: Block[] = []
  const ids = new Map<string, number>()
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()
    if (!line) { i++; continue }

    const heading = line.match(/^(#{2,3})\s+(.+)$/)
    if (heading) {
      const text = plainText(parseInline(heading[2].trim()))
      blocks.push({ kind: 'heading', level: heading[1].length as 2 | 3, text, id: headingId(text, ids) })
      i++; continue
    }

    const figure = line.match(FIGURE)
    if (figure) {
      blocks.push({ kind: 'figure', alt: figure[1], src: figure[2], caption: figure[3] ?? '' })
      i++; continue
    }

    if (line.startsWith('|') && isTableRule((lines[i + 1] ?? '').trim())) {
      const head = cells(line)
      const rows: Inline[][][] = []
      i += 2
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(cells(lines[i++].trim()))
      blocks.push({ kind: 'table', head, rows })
      continue
    }

    const bullet = /^-\s+/
    const numbered = /^\d+\.\s+/
    if (bullet.test(line) || numbered.test(line)) {
      const marker = bullet.test(line) ? bullet : numbered
      const items: Inline[][] = []
      while (i < lines.length && marker.test(lines[i].trim())) items.push(parseInline(lines[i++].trim().replace(marker, '')))
      blocks.push({ kind: 'list', ordered: marker === numbered, items })
      continue
    }

    const paragraph: string[] = []
    while (i < lines.length) {
      const next = lines[i].trim()
      if (!next || /^#{2,3}\s/.test(next) || FIGURE.test(next) || next.startsWith('|') || bullet.test(next) || numbered.test(next)) break
      paragraph.push(next)
      i++
    }
    blocks.push({ kind: 'paragraph', inline: parseInline(paragraph.join(' ')) })
  }
  return blocks
}

/** Every visible word in the blocks, for word counts and plain-text exports. */
export function blocksToText(blocks: Block[]): string {
  return blocks
    .map((block) => {
      switch (block.kind) {
        case 'heading': return block.text
        case 'paragraph': return plainText(block.inline)
        case 'list': return block.items.map(plainText).join('\n')
        case 'table': return [block.head, ...block.rows].map((row) => row.map(plainText).join(' | ')).join('\n')
        case 'figure': return block.caption
      }
    })
    .filter(Boolean)
    .join('\n\n')
}
