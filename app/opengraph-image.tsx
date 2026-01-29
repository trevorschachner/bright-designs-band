import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'

// Route segment config
export const runtime = 'nodejs'

// Image metadata
export const alt = 'Bright Designs - Custom Marching Band Show Design'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

// Image generation
export default async function Image() {
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
          <img 
            src={logoBase64}
            alt="Bright Designs Logo"
            width="120"
            height="120"
            style={{ marginRight: '24px' }}
          />
          <div
            style={{
              fontSize: 32,
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
            maxWidth: '1000px',
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: '20px',
              background: 'linear-gradient(to bottom, #ffffff, #cbd5e1)',
              backgroundClip: 'text',
              color: 'transparent',
              textShadow: '0 4px 8px rgba(0,0,0,0.3)',
            }}
          >
            Premier Marching Band Show Design
          </div>

          <div
            style={{
              fontSize: 36,
              color: '#94a3b8',
              lineHeight: 1.4,
              maxWidth: '900px',
            }}
          >
            Custom arrangements, drill design, and choreography for competitive bands.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
