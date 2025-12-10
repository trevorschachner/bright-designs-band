import { generateOGImage } from '@/lib/og/image-generator'

export const runtime = 'nodejs'
export const alt = 'Contact Bright Designs'
export const contentType = 'image/png'

export default async function Image() {
  return generateOGImage({
    title: 'Start Your Journey',
    description: 'Contact us today for custom marching band design services.',
  })
}

