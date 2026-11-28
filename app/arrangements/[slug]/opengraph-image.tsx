import { getArrangementBySlug } from '@/lib/services/arrangements'
import { gradeLabel } from '@/lib/display'
import { generateOGImage } from '@/lib/og/image-generator'

export const runtime = 'nodejs'

// Cache the rendered OG image for a week so crawlers and link unfurls do not
// re-render it on every request.
export const revalidate = 604800
export const alt = 'Bright Designs Arrangement'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // The page's own cached read: a card render costs no query when the page
  // (or another card) has already loaded this arrangement.
  const arr = /^\d+$/.test(slug) ? null : await getArrangementBySlug(slug)
  const grade = gradeLabel(arr?.grade)

  return generateOGImage({
    subtitle: 'Marching band arrangement',
    title: arr?.title || 'Custom Arrangement',
    chips: [arr?.composer ?? null, grade, arr?.ensembleSize ? `${arr.ensembleSize} ensemble` : null].filter((chip): chip is string => Boolean(chip)),
  })
}
