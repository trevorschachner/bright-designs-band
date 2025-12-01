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
  // Load logo
  const logoPath = join(process.cwd(), 'public/logos/brightdesignslogo-main.png')
  const logoData = readFileSync(logoPath)
  const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`

  const bgGradient = 'linear-gradient(to bottom right, #1e293b, #0f172a)'
  const accentColor = '#3b82f6' // Blue-500

  return new ImageResponse(
    (
      <div
        style={{
          background: bgGradient,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          color: 'white',
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

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          {/* Logo representation */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={logoBase64}
            alt="Bright Designs Logo"
            width="150"
            height="150"
            style={{ marginBottom: '20px' }}
          />
        </div>
        <div
          style={{
            fontSize: 60,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 20,
            textAlign: 'center',
            letterSpacing: '-0.02em',
          }}
        >
          Bright Designs
        </div>
        <div
          style={{
            fontSize: 30,
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: '80%',
          }}
        >
          Custom Marching Band Show Design & Arrangements
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 20,
            color: '#64748b',
          }}
        >
          brightdesigns.band
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
