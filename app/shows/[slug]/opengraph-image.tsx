import { ImageResponse } from 'next/og'
import { db } from '@/lib/database'
import { shows } from '@/lib/database/schema'
import { eq } from 'drizzle-orm'
import { getShowWithTagsBySlug } from '@/lib/database/queries'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'
export const alt = 'Bright Designs Show'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const logoPath = join(process.cwd(), 'public/logos/brightdesignslogo-main.png')
const logoBase64 = `data:image/png;base64,${readFileSync(logoPath).toString('base64')}`

export default async function Image({ params }: { params: { slug: string } }) {
  const { slug } = await params

  let show = null
  const slugResult = await getShowWithTagsBySlug(slug)
  if (slugResult) {
    show = slugResult.show
  } else if (/^\d+$/.test(slug)) {
    show = await db.query.shows.findFirst({ where: eq(shows.id, parseInt(slug, 10)) })
  }

  const title = show?.title || 'Bright Designs Band'
  const graphicUrl = show?.graphicUrl || show?.thumbnailUrl

  // Use actual show art when available
  if (graphicUrl) {
    try {
      const res = await fetch(graphicUrl)
      if (res.ok) {
        const buf = await res.arrayBuffer()
        const ext = graphicUrl.includes('.png') ? 'png' : 'jpeg'
        const imgSrc = `data:image/${ext};base64,${Buffer.from(buf).toString('base64')}`

        return new ImageResponse(
          (
            <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative' }}>
              <img src={imgSrc} alt="" style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)', display: 'flex' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '44px 48px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ color: 'white', fontSize: 68, fontWeight: 800, lineHeight: 1.05, textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
                  {title.length > 40 ? title.slice(0, 40) + '…' : title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img src={logoBase64} alt="" width="36" height="36" />
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 22, fontWeight: 600, letterSpacing: '0.04em' }}>BRIGHT DESIGNS</span>
                  {show?.year && <span style={{ color: '#60a5fa', fontSize: 22 }}>· {show.year}</span>}
                  {show?.difficulty && <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 22 }}>· {show.difficulty}</span>}
                </div>
              </div>
            </div>
          ),
          { ...size }
        )
      }
    } catch {
      // fall through to branded text card
    }
  }

  // Fallback: branded text card
  const description = show?.description || 'Custom Marching Band Show Design'
  const difficulty = show?.difficulty?.replace('_', ' ').replace('plus', '+') || ''
  const year = show?.year || ''

  return new ImageResponse(
    (
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, #1e293b, #0f172a)', color: 'white', padding: '40px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)', backgroundSize: '100px 100px' }} />
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <img src={logoBase64} alt="" width="80" height="80" style={{ marginRight: '16px' }} />
          <div style={{ fontSize: 24, fontWeight: 600, color: '#3b82f6', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Bright Designs</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: '900px' }}>
          <div style={{ fontSize: 80, fontWeight: 800, lineHeight: 1.1, marginBottom: '20px', background: 'linear-gradient(to bottom, #ffffff, #cbd5e1)', backgroundClip: 'text', color: 'transparent' }}>{title}</div>
          <div style={{ fontSize: 32, color: '#94a3b8', lineHeight: 1.4, maxWidth: '800px' }}>{description.length > 100 ? description.substring(0, 100) + '...' : description}</div>
        </div>
        <div style={{ display: 'flex', marginTop: '40px', gap: '20px' }}>
          {year && <div style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: '8px', padding: '8px 20px', fontSize: 24, color: '#60a5fa' }}>{year}</div>}
          {difficulty && <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '8px 20px', fontSize: 24, color: '#e2e8f0', textTransform: 'capitalize' }}>{difficulty}</div>}
        </div>
      </div>
    ),
    { ...size }
  )
}
