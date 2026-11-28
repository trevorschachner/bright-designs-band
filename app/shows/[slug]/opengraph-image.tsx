import { ImageResponse } from 'next/og'
import { getShowBySlug, getPublicShowFiles } from '@/lib/services/shows'
import { showArt } from '@/lib/media/show-art'
import sharp from 'sharp'
import { OG, OG_ACCENT, OgBackdrop, clip, generateOGImage, ogFonts, ogLogo } from '@/lib/og/image-generator'

export const runtime = 'nodejs'

// Cache the rendered OG image for a week. Without this every crawler, social
// unfurl, and link preview re-renders it and re-fetches the source art from
// Supabase Storage, which was a large share of our cached egress.
export const revalidate = 604800
export const alt = 'Bright Designs Show'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// 16:9, the shape show art is made in. It floats on the backdrop beside a brand panel.
const ART = { width: 848, height: 477 }

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
      <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative', color: 'white', fontFamily: 'Poppins' }}>
        <OgBackdrop />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 12, display: 'flex', backgroundImage: OG_ACCENT }} />
        <div style={{ display: 'flex', flexDirection: 'column', padding: '36px 0 0 40px' }}>
          {/* The art is shown whole and keeps its own lettering, so nothing is laid over it. */}
          <img src={art} alt="" width={ART.width} height={ART.height} style={{ borderRadius: 22, border: '2px solid rgba(255,255,255,0.22)', boxShadow: '0 24px 60px rgba(4,8,30,0.6)' }} />
          <div style={{ display: 'flex', marginTop: 20, fontSize: title.length > 30 ? 40 : 50, fontWeight: 700, letterSpacing: '-0.03em' }}>{clip(title, 40)}</div>
        </div>
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'space-between', padding: '36px 36px 44px 32px' }}>
          <div style={{ display: 'flex', alignSelf: 'flex-start', backgroundColor: 'white', borderRadius: 16, padding: '9px 16px' }}>
            <img src={ogLogo()} alt="" width={126} height={66} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignSelf: 'flex-start', backgroundColor: OG.yellow, color: OG.midnight, borderRadius: 999, padding: '6px 16px', fontSize: 15, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Marching band show</div>
            {facts.map((fact) => (
              <div key={fact} style={{ display: 'flex', alignSelf: 'flex-start', border: '1.5px solid rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 999, padding: '5px 18px', fontSize: 21, textTransform: 'capitalize' }}>{fact}</div>
            ))}
            <div style={{ display: 'flex', marginTop: 8, fontSize: 20, color: 'rgba(255,255,255,0.8)' }}>brightdesigns.band</div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: ogFonts() }
  )
}
