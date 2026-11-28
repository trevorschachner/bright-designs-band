import { getCollectionBySlug } from '@/lib/collections'
import { generateOGImage } from '@/lib/og/image-generator'

export const runtime = 'nodejs'

// Cache the rendered OG image for a week so crawlers and link unfurls do not
// re-render it on every request.
export const revalidate = 604800
export const alt = 'Bright Designs Collection'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const collection = getCollectionBySlug(slug)
  return generateOGImage({
    title: collection?.h1 || 'Marching Band Show Collections',
    description: collection?.description,
  })
}
