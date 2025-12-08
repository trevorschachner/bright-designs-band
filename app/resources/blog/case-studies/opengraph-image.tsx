import { generateOGImage } from '@/lib/og/image-generator'

export const runtime = 'nodejs'
export const alt = 'Bright Designs Case Studies'
export const contentType = 'image/png'

export default async function Image() {
  return generateOGImage({
    title: 'Success Stories',
    description: 'See how we help bands achieve competitive success.',
  })
}

