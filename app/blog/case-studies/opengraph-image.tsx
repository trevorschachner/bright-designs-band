import { generateOGImage } from '@/lib/og/image-generator'

export const runtime = 'nodejs'
export const alt = 'Marching Band Success Stories & Case Studies'
export const contentType = 'image/png'

export default async function Image() {
  return generateOGImage({
    title: 'Success Stories',
    description: 'Travelers Rest, Dorman & Alpharetta — from State Medalist to BOA Finalist.',
  })
}
