import { ImageResponse } from 'next/og'
import { getShowBySlug, getPublicShowFiles } from '@/lib/services/shows'
import { showArt } from '@/lib/media/show-art'
import { artDataUrl } from '@/lib/og/covers'
import { OG, OgGrid, OgHeader, clip, generateOGImage, ogFonts, ogLogo } from '@/lib/og/image-generator'

export const runtime = 'nodejs'

// Cache the rendered OG image for a week. Without this every crawler, social
// unfurl, and link preview re-renders it and re-fetches the source art from
// Supabase Storage, which was a large share of our cached egress.
export const revalidate = 604800
export const alt = 'Bright Designs Show'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// 16:9, the shape show art is made in.
const ART = { width: 688, height: 387 }

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // The same cached exact-slug read as the page (lib/services/shows.ts).
  const show = (await getShowBySlug(slug))?.show ?? null
  const title = show?.title || 'Bright Designs'
  const difficulty = show?.difficulty?.replace('_', ' ').replace('plus', '+') ?? null
  const facts = [show?.year ? String(show.year) : null, difficulty].filter((fact): fact is string => Boolean(fact))

  // The page's own facts line: runtime, and who it was written for.
  const meta = [show?.duration ? `${show.duration} runtime` : null, show?.commissioned ? `Written for ${show.commissioned}` : null].filter((line): line is string => Boolean(line))

  // The same art as the page: its first image file is the fallback, from the
  // same cached files read.
  const showFiles = show ? await getPublicShowFiles(show.id) : []
  const graphicUrl = showArt({ ...show, imageUrl: showFiles.find((f) => f.fileType === 'image')?.url })
  const art = graphicUrl ? await artDataUrl(graphicUrl, ART, revalidate) : null

  if (!art) {
    return generateOGImage({
      title,
      description: show?.description || 'Marching band show',
      chips: facts,
    })
  }

  // Laid out like the show page: art on the left with the site's soft shadow,
  // badges, title and description on the right.
  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: 'white', color: OG.charcoal, position: 'relative', fontFamily: 'Poppins' }}>
        <OgGrid height={630} />
        <OgHeader />
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', padding: '0 44px', gap: 36 }}>
          <img src={art} alt="" width={ART.width} height={ART.height} style={{ borderRadius: 10, boxShadow: '0 10px 28px rgba(0,0,0,0.18)' }} />
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              {facts.map((fact, i) => (
                <div key={fact} style={{ display: 'flex', borderRadius: 999, padding: '4px 18px', fontSize: 22, fontWeight: 700, textTransform: 'capitalize', ...(i === 0 ? { border: `1px solid ${OG.line}`, backgroundColor: 'white' } : { backgroundColor: OG.midnight, color: 'white' }) }}>{fact}</div>
              ))}
            </div>
            <div style={{ display: 'flex', marginTop: 16, fontSize: title.length > 22 ? 44 : 58, fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.03em' }}>{clip(title, 44)}</div>
            {show?.description ? <div style={{ display: 'flex', marginTop: 14, fontSize: 22, lineHeight: 1.45, color: OG.muted }}>{clip(show.description, 96)}</div> : null}
            {meta.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: 18, paddingTop: 16, borderTop: `1px solid ${OG.line}`, fontSize: 21 }}>
                {meta.map((line) => (
                  <div key={line} style={{ display: 'flex', marginTop: 2 }}>{line}</div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div style={{ display: 'flex', height: 10, backgroundColor: OG.yellow }} />
      </div>
    ),
    { ...size, fonts: ogFonts() }
  )
}
