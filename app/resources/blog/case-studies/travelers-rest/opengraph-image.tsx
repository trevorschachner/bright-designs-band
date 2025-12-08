import { generateOGImage } from '@/lib/og/image-generator'

export const runtime = 'nodejs'
export const alt = 'Travelers Rest Case Study'
export const contentType = 'image/png'

export default async function Image() {
  return generateOGImage({
    title: 'Travelers Rest High School',
    description: 'From 14th Place to State Medalist: A Journey of Strategic Design.',
  })
}

