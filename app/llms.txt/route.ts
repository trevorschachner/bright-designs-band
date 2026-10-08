import { getShowIndex } from '@/lib/services/shows'
import { collections } from '@/lib/collections'
import { buildLlmsTxt } from '@/lib/seo/llms'

/** /llms.txt from the cached catalog (tag `shows`), refreshed by show writes. */
export const revalidate = 3600

export async function GET() {
  const body = buildLlmsTxt(await getShowIndex(), collections)
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600',
    },
  })
}
