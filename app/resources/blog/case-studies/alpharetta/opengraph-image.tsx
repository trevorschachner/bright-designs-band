import { generateOGImage } from '@/lib/og/image-generator'

export const runtime = 'nodejs'
export const alt = 'Alpharetta High School Case Study'
export const contentType = 'image/png'

export default async function Image() {
  return generateOGImage({
    title: 'Alpharetta High School',
    description: 'Competing at the Highest Level: Sonic Depth and Feature Moments.',
  })
}

