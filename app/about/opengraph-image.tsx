import { generateOGImage } from '@/lib/og/image-generator'

export const runtime = 'nodejs'
export const alt = 'About Bright Designs'
export const contentType = 'image/png'

export default async function Image() {
  return generateOGImage({
    title: 'About Bright Designs',
    description: 'Expert Marching Band Designers Serving Southeast BOA Bands',
  })
}

