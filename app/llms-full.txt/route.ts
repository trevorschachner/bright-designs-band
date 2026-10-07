import { getShowIndex } from '@/lib/services/shows'
import { FAQS } from '@/lib/content/faqs'
import { buildLlmsFullTxt } from '@/lib/seo/llms'

/** /llms-full.txt: full show descriptions and the FAQ text, from the cached catalog. */
export const revalidate = 3600

export async function GET() {
  const body = buildLlmsFullTxt(await getShowIndex(), FAQS)
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600',
    },
  })
}
