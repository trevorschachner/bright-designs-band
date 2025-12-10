import { generateOGImage } from '@/lib/og/image-generator'

export const runtime = 'nodejs'
export const alt = 'How to Choose a Show Designer'
export const contentType = 'image/png'

export default async function Image() {
  return generateOGImage({
    title: 'How to Choose a Show Designer',
    description: 'A comprehensive guide to finding the right design partner for your band.',
  })
}

