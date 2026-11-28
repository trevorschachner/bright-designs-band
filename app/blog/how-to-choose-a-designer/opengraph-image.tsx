import { generateOGImage } from '@/lib/og/image-generator'

export const runtime = 'nodejs'
export const alt = 'How to Choose a Marching Band Show Designer'
export const contentType = 'image/png'

export default async function Image() {
  return generateOGImage({
    title: 'How to Choose a Marching Band Show Designer',
    description: 'Avoid ghosting, missed deadlines, and unplayable parts.',
  })
}
