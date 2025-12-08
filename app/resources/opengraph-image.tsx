import { generateOGImage } from '@/lib/og/image-generator'

export const runtime = 'nodejs'
export const alt = 'Bright Designs Resources'
export const contentType = 'image/png'

export default async function Image() {
  return generateOGImage({
    title: 'Director Resources',
    description: 'Guides, Case Studies, and Tools for Band Directors',
  })
}

