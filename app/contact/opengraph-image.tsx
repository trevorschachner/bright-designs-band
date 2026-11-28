import { generateOGImage } from '@/lib/og/image-generator'

export const runtime = 'nodejs'
export const alt = 'Contact Bright Designs'
export const contentType = 'image/png'

export default async function Image() {
  return generateOGImage({
    title: 'Contact Us',
    description: "Have a question or a project in mind? We'd love to hear from you.",
  })
}

