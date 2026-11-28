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

// 16:9, the shape show art is made in. It sits flush in the corner beside a brand panel.
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
      .resize(ART.width, ART.height, { fit: 'contain', background: OG.yellow })
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
      chips: facts,
    })
  }

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: OG.yellow, color: OG.midnight, fontFamily: 'Poppins' }}>
        <div style={{ display: 'flex', height: ART.height }}>
          {/* The art is shown whole, flush to the corner, and keeps its own lettering. */}
          <img src={art} alt="" width={ART.width} height={ART.height} />
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'space-between', borderLeft: `6px solid ${OG.midnight}`, padding: '34px 28px 26px' }}>
            <div style={{ display: 'flex', alignSelf: 'flex-start', backgroundColor: 'white', padding: '8px 14px' }}>
              <img src={ogLogo()} alt="" width={126} height={66} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', fontSize: 17, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Marching band show</div>
              {facts.map((fact) => (
                <div key={fact} style={{ display: 'flex', marginTop: 10, paddingTop: 10, borderTop: `3px solid ${OG.midnight}`, fontSize: 30, fontWeight: 700, textTransform: 'capitalize' }}>{fact}</div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'space-between', borderTop: `6px solid ${OG.midnight}`, padding: '0 36px 0 40px', gap: 24 }}>
          <div style={{ display: 'flex', fontSize: title.length > 30 ? 42 : 56, fontWeight: 700, letterSpacing: '-0.035em' }}>{clip(title, 40)}</div>
          <div style={{ display: 'flex', fontSize: 22, fontWeight: 700 }}>brightdesigns.band</div>
        </div>
      </div>
    ),
    { ...size, fonts: ogFonts() }
  )
}
