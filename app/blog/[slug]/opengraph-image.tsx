import { getArticle } from '@/lib/content/articles'
import { generateOGImage } from '@/lib/og/image-generator'

export const runtime = 'nodejs'
export const alt = 'Bright Designs article'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getArticle(slug)
  return generateOGImage({
    title: article?.title ?? 'Bright Designs',
    subtitle: article ? `${article.author} · Bright Designs` : 'Bright Designs',
  })
}
