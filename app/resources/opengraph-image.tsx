import { generateOGImage } from '@/lib/og/image-generator'

export const runtime = 'nodejs'
export const alt = 'Bright Designs Resources'
export const contentType = 'image/png'

export default async function Image() {
  return generateOGImage({
    title: 'Resources',
    description: 'Free guides and tools to help your program succeed.',
  })
}

