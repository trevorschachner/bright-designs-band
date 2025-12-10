import { ImageResponse } from 'next/og'
import { getCollectionBySlug } from '@/lib/collections'
import { readFileSync } from 'fs'
import { join } from 'path'

// Route segment config
export const runtime = 'nodejs'

// Image metadata
export const alt = 'Bright Designs Collection'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image({ params }: { params: { slug: string } }) {
  const { slug } = await params
  const collection = getCollectionBySlug(slug)
  
  // Fallback values if collection not found (though this page would 404 ideally)
  const title = collection?.h1 || 'Marching Band Show Collections'
  const description = collection?.description || 'Curated collections of high-quality marching band shows.'
  
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
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={logoBase64}
            alt="Bright Designs Logo"
            width="100"
            height="100"
            style={{ marginRight: '20px' }}
          />
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: accentColor,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Bright Designs Collection
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
            maxWidth: '1000px',
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: '24px',
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
              maxWidth: '900px',
              display: '-webkit-box',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {description}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

