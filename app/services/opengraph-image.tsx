import { generateOGImage } from '@/lib/og/image-generator'

export const runtime = 'nodejs'
export const alt = 'Bright Designs Services'
export const contentType = 'image/png'

export default async function Image() {
  return generateOGImage({
    title: 'Our Services',
    description: 'Full show design packages, standalone consultation and teaching.',
  })
}

