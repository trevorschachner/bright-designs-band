import { generateOGImage } from '@/lib/og/image-generator'

export const runtime = 'nodejs'

// Cache the rendered OG image for a week so crawlers and link unfurls do not
// re-render it on every request.
export const revalidate = 604800
export const alt = 'Bright Designs - Custom Marching Band Show Design'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return generateOGImage({
    subtitle: 'Marching band show design',
    title: 'Custom shows, and shows for sale',
  })
}
