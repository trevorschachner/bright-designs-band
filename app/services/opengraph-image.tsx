import { generateOGImage } from '@/lib/og/image-generator'

export const runtime = 'nodejs'
export const alt = 'Bright Designs Services'
export const contentType = 'image/png'

export default async function Image() {
  return generateOGImage({
    title: 'Professional Design Services',
    description: 'Custom Show Design, Arrangements, Drill Writing & Consultation',
  })
}

