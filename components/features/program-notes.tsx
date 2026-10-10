import type { ProgramNotes as Notes } from '@/lib/content/program-notes'

export function ProgramNotes({ notes, className }: { notes: Notes; className?: string }) {
  if (notes.sections.length === 0) return null
  return (
    <div className={className}>
      {notes.sections.map((section, i) => (
        <div key={i} className="mb-6">
          {section.heading && <h3 className="text-xl font-heading font-semibold text-foreground mb-2">{section.heading}</h3>}
          {section.blocks.map((block, j) =>
            block.kind === 'p' ? (
              <p key={j} className="text-muted-foreground leading-relaxed mb-3">{block.text}</p>
            ) : (
              <ul key={j} className="list-disc pl-6 text-muted-foreground space-y-1 mb-3">
                {block.items.map((item, k) => <li key={k}>{item}</li>)}
              </ul>
            )
          )}
        </div>
      ))}
    </div>
  )
}
