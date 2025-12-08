import { generateOGImage } from '@/lib/og/image-generator'

export const runtime = 'nodejs'
export const alt = 'Dorman High School Case Study'
export const contentType = 'image/png'

export default async function Image() {
  return generateOGImage({
    title: 'Dorman High School',
    description: 'Scaling Excellence: Managing Design for a 200+ Member Ensemble.',
  })
}

