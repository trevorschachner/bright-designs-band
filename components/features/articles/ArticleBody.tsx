import Link from 'next/link'
import type { ReactNode } from 'react'
import type { ArticleBlock } from '@/lib/content/articles'
import type { Inline } from '@/lib/content/markdown'

function renderInline(nodes: Inline[]): ReactNode[] {
  return nodes.map((node, i) => {
    if (node.kind === 'text') return node.text
    if (node.kind === 'bold') return <strong key={i}>{renderInline(node.children)}</strong>
    return node.href.startsWith('/') ? (
      <Link key={i} href={node.href}>{renderInline(node.children)}</Link>
    ) : (
      <a key={i} href={node.href} rel="noopener">{renderInline(node.children)}</a>
    )
  })
}

/** An article's blocks as server-rendered HTML. No client JavaScript. */
export function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <div className="prose prose-lg max-w-none prose-headings:scroll-mt-24 prose-a:text-primary">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case 'heading':
            return block.level === 2 ? <h2 key={i} id={block.id}>{block.text}</h2> : <h3 key={i} id={block.id}>{block.text}</h3>
          case 'paragraph':
            return <p key={i} className={i === 0 ? 'lead' : undefined}>{renderInline(block.inline)}</p>
          case 'list': {
            const items = block.items.map((item, j) => <li key={j}>{renderInline(item)}</li>)
            return block.ordered ? <ol key={i}>{items}</ol> : <ul key={i}>{items}</ul>
          }
          case 'table':
            return (
              <div key={i} className="not-prose my-8 overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/60">
                    <tr>{block.head.map((cell, j) => <th key={j} scope="col" className="px-4 py-3 font-semibold">{renderInline(cell)}</th>)}</tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={r} className="border-t border-border align-top">
                        {row.map((cell, j) => <td key={j} className="px-4 py-3">{renderInline(cell)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          case 'figure':
            return (
              <figure key={i} className="not-prose my-10">
                {/* A plain img: these are small local SVGs, which the image optimizer does not serve. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={block.src}
                  alt={block.alt}
                  width={block.width}
                  height={block.height}
                  loading={i < 3 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="h-auto w-full rounded-xl"
                />
                {block.caption ? <figcaption className="mt-3 text-sm text-muted-foreground">{block.caption}</figcaption> : null}
              </figure>
            )
        }
      })}
    </div>
  )
}
