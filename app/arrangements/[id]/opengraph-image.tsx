import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/utils/supabase/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'

export const alt = 'Bright Designs Arrangement'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image({ params }: { params: { id: string } }) {
  const { id } = await params
  
  // Fetch arrangement data using Supabase direct client to reuse logic or just simple query
  // Since we are in an image route, let's just use the DB directly if possible or Supabase
  const supabase = await createClient()
  
  const { data: arr } = await supabase
    .from('arrangements')
    .select('title, composer, grade, ensemble_size')
    .eq('id', id)
    .single()

  // Fallback values
  const title = arr?.title || 'Custom Arrangement'
  const composer = arr?.composer || 'Bright Designs'
  const grade = arr?.grade ? arr.grade.replace('_', ' ').replace('plus', '+') : ''
  const ensemble = arr?.ensemble_size || ''

  // Load logo
  const logoPath = join(process.cwd(), 'public/bright-designs-logo.png')
  const logoData = readFileSync(logoPath)
  const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`

  // Brand colors
  const bgGradient = 'linear-gradient(to bottom right, #0f172a, #1e293b)'
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
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
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
            Bright Designs Arrangement
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
              fontSize: 70,
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
              marginBottom: '40px',
            }}
          >
            by {composer}
          </div>
        </div>

        {/* Badges/Info */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
          }}
        >
          {grade && (
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '8px',
                padding: '8px 20px',
                fontSize: 24,
                color: '#60a5fa',
                textTransform: 'capitalize',
              }}
            >
              Grade {grade}
            </div>
          )}
          {ensemble && (
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
              {ensemble} Ensemble
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

