import { ImageResponse } from 'next/og'
import { getShowBySlug, getPublicShowFiles } from '@/lib/services/shows'
import { showArt } from '@/lib/media/show-art'
import sharp from 'sharp'
import { OG, clip, generateOGImage, ogFonts, ogLogo } from '@/lib/og/image-generator'

export const runtime = 'nodejs'

// Cache the rendered OG image for a week. Without this every crawler, social
// unfurl, and link preview re-renders it and re-fetches the source art from
// Supabase Storage, which was a large share of our cached egress.
export const revalidate = 604800
export const alt = 'Bright Designs Show'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// 16:9, the shape show art is made in, beside a brand panel and above a title bar.
const ART = { width: 928, height: 522 }

/**
 * The show's art as a card-sized JPEG data URL, or null. Satori can't decode
 * WebP (all show art is WebP post-migration), and its decode failure surfaces
 * mid-stream, so the art is converted before Satori ever sees it.
 */
async function artDataUrl(url: string): Promise<string | null> {
  try {
    // Next's data cache silently declines entries over 2MB, so this caching
    // only holds while show art stays small (~200-500KB WebP). The route-level
    // `revalidate` above is the real protection.
    const res = await fetch(url, { next: { revalidate } })
    if (!res.ok) return null
    const jpeg = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(ART.width, ART.height, { fit: 'contain', background: OG.midnight })
      .jpeg({ quality: 85 })
      .toBuffer()
    return `data:image/jpeg;base64,${jpeg.toString('base64')}`
  } catch {
    return null
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // The same cached exact-slug read as the page (lib/services/shows.ts).
  const show = (await getShowBySlug(slug))?.show ?? null
  const title = show?.title || 'Bright Designs'
  const difficulty = show?.difficulty?.replace('_', ' ').replace('plus', '+') ?? null
  const facts = [show?.year ? String(show.year) : null, difficulty].filter((fact): fact is string => Boolean(fact))

  // The same art as the page: its first image file is the fallback, from the
  // same cached files read.
  const showFiles = show ? await getPublicShowFiles(show.id) : []
  const graphicUrl = showArt({ ...show, imageUrl: showFiles.find((f) => f.fileType === 'image')?.url })
  const art = graphicUrl ? await artDataUrl(graphicUrl) : null

  if (!art) {
    return generateOGImage({
      subtitle: 'Marching band show',
      title,
      description: show?.description || 'Custom marching band show design',
      chips: facts,
    })
  }

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: OG.midnight, color: 'white', fontFamily: 'Poppins' }}>
        <div style={{ display: 'flex', height: ART.height }}>
          {/* The art is shown whole and keeps its own lettering, so nothing is laid over it. */}
          <img src={art} alt="" width={ART.width} height={ART.height} />
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'space-between', padding: '32px 28px' }}>
            <div style={{ display: 'flex', alignSelf: 'flex-start', background: 'white', borderRadius: 14, padding: '8px 14px' }}>
              <img src={ogLogo()} alt="" width={115} height={60} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: OG.yellow }}>Marching band show</div>
              {facts.map((fact) => (
                <div key={fact} style={{ display: 'flex', alignSelf: 'flex-start', border: `2px solid ${OG.yellow}`, borderRadius: 999, padding: '4px 16px', fontSize: 20, color: OG.yellow, textTransform: 'capitalize' }}>{fact}</div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', height: 8, background: OG.yellow }} />
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'space-between', padding: '0 36px', gap: 24 }}>
          <div style={{ display: 'flex', fontSize: title.length > 34 ? 36 : 46, fontWeight: 700, letterSpacing: '-0.01em' }}>{clip(title, 44)}</div>
          <div style={{ display: 'flex', fontSize: 22, color: OG.lampshade, opacity: 0.8 }}>brightdesigns.band</div>
        </div>
      </div>
    ),
    { ...size, fonts: ogFonts() }
  )
}
