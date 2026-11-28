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
    title: 'Student centered marching band design.',
    highlight: 'marching band design.',
    description: 'We design marching band shows that help students shine.',
  })
}
