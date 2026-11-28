import { generateOGImage } from '@/lib/og/image-generator'

export const runtime = 'nodejs'
export const alt = 'Marching Band Show Catalog'
export const contentType = 'image/png'

export default async function Image() {
  return generateOGImage({
    title: 'Show Catalog',
    description: 'Marching band shows for sale, and custom shows written for your band.',
  })
}

