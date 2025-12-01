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

  return new ImageResponse(
    (
      <div
        style={{
          background: '#ffffff',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={logoBase64}
          alt="Bright Designs Logo"
          width="360"
          height="360"
          style={{
            objectFit: 'contain',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  )
}
