import { generateOGImage } from '@/lib/og/image-generator'

export const runtime = 'nodejs'
export const alt = 'Marching Band Show Catalog'
export const contentType = 'image/png'

export default async function Image() {
  return generateOGImage({
    title: 'Marching Band Shows',
    description: 'Browse our catalog of championship-caliber shows for your band.',
  })
}

