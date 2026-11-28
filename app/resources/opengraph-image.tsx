import { generateOGImage } from '@/lib/og/image-generator'

export const runtime = 'nodejs'
export const alt = 'Bright Designs Resources'
export const contentType = 'image/png'

export default async function Image() {
  return generateOGImage({
    title: 'Resources for directors',
  })
}

