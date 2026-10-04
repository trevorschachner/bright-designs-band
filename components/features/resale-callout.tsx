import Link from 'next/link'
import { ArrowRight, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { arrangementContactHref, contactHref, showContactHref } from '@/lib/contact-link'

/**
 * Every show and every arrangement on the site is for sale, priced by
 * conversation. Three ways to buy: the full show as-is, build your own from
 * existing arrangements, or partial custom (new pieces plus existing ones).
 */
type ResaleCalloutProps =
  | { kind: 'show' | 'arrangement'; title: string; className?: string }
  | { kind: 'catalog'; title?: never; className?: string }

const copy = {
  show: {
    heading: 'Like this show? Use it as-is, swap parts, or mix in new music.',
    body: 'Every show here is available. Take it as written, trade a movement for an arrangement from another show, or have us write a few new pieces around the parts you like.',
    cta: 'Talk to us about this show',
  },
  arrangement: {
    heading: 'Build your own show',
    body: 'Every arrangement here is available on its own. Combine it with arrangements from other shows, or add it to a show where we write a few new pieces for your band.',
    cta: 'Talk to us about this arrangement',
  },
  catalog: {
    heading: 'Build your own show',
    body: 'Every arrangement here is available. Combine arrangements from different shows, or add a few to a show where we write new pieces for your band.',
    cta: 'Talk to us',
  },
} as const

export function ResaleCallout({ kind, title, className }: ResaleCalloutProps) {
  const text = copy[kind]
  const href =
    kind === 'show'
      ? showContactHref(title)
      : kind === 'arrangement'
        ? arrangementContactHref(title)
        : contactHref('Build your own show')

  return (
    <div
      className={cn(
        'frame-card border border-primary/20 bg-primary/5 p-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-6',
        className
      )}
    >
      <div className="flex-1">
        <h2 className="text-xl font-heading font-bold text-foreground mb-1">{text.heading}</h2>
        <p className="text-sm text-muted-foreground">
          {text.body} Pricing depends on what you need, so we&apos;ll work it out together.
        </p>
      </div>
      <Button asChild className="shrink-0">
        <Link href={href}>
          <MessageSquare className="w-4 h-4 mr-2" aria-hidden="true" />
          {text.cta}
          <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
        </Link>
      </Button>
    </div>
  )
}
