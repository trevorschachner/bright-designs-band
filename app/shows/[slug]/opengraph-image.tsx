import { ImageResponse } from 'next/og'
import { db } from '@/lib/database'
import { shows } from '@/lib/database/schema'
import { eq } from 'drizzle-orm'
import { getShowWithTagsBySlug } from '@/lib/database/queries'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'

export const alt = 'Bright Designs Show'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image({ params }: { params: { slug: string } }) {
  const { slug } = await params
  
  // Fetch show data
  let show = null
  const slugResult = await getShowWithTagsBySlug(slug)
  
  if (slugResult) {
    show = slugResult.show
  } else if (/^\d+$/.test(slug)) {
    const numericId = parseInt(slug, 10)
    const showResult = await db.query.shows.findFirst({
      where: eq(shows.id, numericId),
    })
    show = showResult
  }

  // Fallback values
  const title = show?.title || 'Bright Designs Band'
  const description = show?.description || 'Custom Marching Band Show Design'
  const difficulty = show?.difficulty ? show.difficulty.replace('_', ' ').replace('plus', '+') : ''
  const year = show?.year || ''

  // Load logo
  const logoPath = join(process.cwd(), 'public/logos/brightdesignslogo-main.png')
  const logoData = readFileSync(logoPath)
  const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`

  // Brand colors
  const bgGradient = 'linear-gradient(to bottom right, #1e293b, #0f172a)'
  const accentColor = '#3b82f6' // Blue-500

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: bgGradient,
          color: 'white',
          padding: '40px',
          position: 'relative',
        }}
      >
        {/* Background Pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: 'radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)',
            backgroundSize: '100px 100px',
          }}
        />

        {/* Logo/Brand */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={logoBase64}
            alt="Bright Designs Logo"
            width="80"
            height="80"
            style={{ marginRight: '16px' }}
          />
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: accentColor,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Bright Designs
          </div>
        </div>

        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            maxWidth: '900px',
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: '20px',
              background: 'linear-gradient(to bottom, #ffffff, #cbd5e1)',
              backgroundClip: 'text',
              color: 'transparent',
              textShadow: '0 4px 8px rgba(0,0,0,0.3)',
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: 32,
              color: '#94a3b8',
              lineHeight: 1.4,
              maxWidth: '800px',
              display: '-webkit-box',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {description.length > 100 ? description.substring(0, 100) + '...' : description}
          </div>
        </div>

        {/* Badges/Info */}
        <div
          style={{
            display: 'flex',
            marginTop: '40px',
            gap: '20px',
          }}
        >
          {year && (
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '8px',
                padding: '8px 20px',
                fontSize: 24,
                color: '#60a5fa',
              }}
            >
              {year}
            </div>
          )}
          {difficulty && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '8px 20px',
                fontSize: 24,
                color: '#e2e8f0',
                textTransform: 'capitalize',
              }}
            >
              {difficulty}
            </div>
          )}
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

