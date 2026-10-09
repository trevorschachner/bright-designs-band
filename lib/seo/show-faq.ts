import type { Faq } from '@/lib/content/faqs'
import type { ProgramNotes } from '@/lib/content/program-notes'

type ShowFacts = { title: string; difficulty: string | null; duration: string | null; ensembleSize: string | null; year: number | null; commissioned: string | null }
type Part = { title: string; scene: string | null; pieces: string[] }

const sectionText = (notes: ProgramNotes, heading: string) =>
  notes.sections.find((s) => s.heading?.toLowerCase() === heading)?.blocks
    .map((b) => (b.kind === 'p' ? b.text : b.items.join('; ')))
    .join(' ') ?? ''

const SIZE = { small: 'small bands', medium: 'medium-sized bands', large: 'large bands' } as const

export function showFaqs(show: ShowFacts, notes: ProgramNotes, parts: Part[]): Faq[] {
  const faqs: Faq[] = []
  if (notes.summary) faqs.push({ question: `What is ${show.title} about?`, answer: notes.summary })
  const music = parts.map((p, i) => `${p.scene ?? `Part ${i + 1}`}: ${p.pieces.length ? p.pieces.join(', ') : p.title}`).join('. ')
  if (music) faqs.push({ question: `What music is in ${show.title}?`, answer: `${music}.` })
  const suits = sectionText(notes, 'who it suits')
  const facts = [show.difficulty ? `${show.difficulty} difficulty` : null, show.ensembleSize ? `written for ${SIZE[show.ensembleSize as keyof typeof SIZE] ?? show.ensembleSize}` : null, show.duration ? `about ${show.duration} long` : null].filter(Boolean).join(', ')
  if (suits || facts) faqs.push({ question: `Who is ${show.title} for?`, answer: [facts ? `${facts}.` : '', suits].filter(Boolean).join(' ') })
  return faqs
}
