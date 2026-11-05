import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'
import { COLS, ROWS, YEAR_DOTS } from '@/components/features/free-show/drill-year-art'
import { FREE_SHOW_DEADLINE_LABEL } from '@/lib/free-show'

export const runtime = 'nodejs'
export const alt = 'Win a free 2027 indoor winds show from Bright Designs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// The hero's drill chart, set 2 ("27"), drawn with divs for Satori.
const STEP = 15

export default async function Image() {
  const file = (path: string) => readFileSync(join(process.cwd(), path))
  const logo = file('public/logos/brightdesignslogo-main.png').toString('base64')
  const w = COLS * STEP
  const h = ROWS * STEP

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', background: '#1A244D', color: 'white', padding: '0 56px', gap: 40, fontFamily: 'Poppins' }}>
        <div style={{ display: 'flex', flexDirection: 'column', width: 580 }}>
          <div style={{ display: 'flex', alignSelf: 'flex-start', background: 'white', borderRadius: 16, padding: '10px 18px' }}>
            <img src={`data:image/png;base64,${logo}`} alt="" width={134} height={70} />
          </div>
          <div style={{ marginTop: 36, fontSize: 20, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#FFD230' }}>
            2027 Indoor Winds Giveaway
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 12, fontSize: 62, fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.02em' }}>
            <div style={{ display: 'flex' }}>
              Win a<span style={{ color: '#FFD230', marginLeft: 16 }}>free</span>
            </div>
            <div style={{ display: 'flex' }}>2027 winds show.</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 24, fontSize: 25, lineHeight: 1.4, color: '#D1D5DB' }}>
            <div>Drill, wind music and copyright covered.</div>
            <div>{`Free to enter by ${FREE_SHOW_DEADLINE_LABEL}.`}</div>
          </div>
        </div>

        <div style={{ display: 'flex', background: 'white', borderRadius: 24, padding: 20 }}>
          <div style={{ position: 'relative', display: 'flex', width: w, height: h }}>
            {Array.from({ length: COLS - 1 }, (_, i) => i + 1).map(c => (
              <div key={`c${c}`} style={{ position: 'absolute', left: c * STEP, top: 0, width: 1, height: h, background: c % 4 ? '#DDDDDD' : '#000000' }} />
            ))}
            {Array.from({ length: ROWS - 1 }, (_, i) => i + 1).map(r => (
              <div key={`r${r}`} style={{ position: 'absolute', top: r * STEP, left: 0, height: 1, width: w, background: r % 4 ? '#DDDDDD' : '#000000' }} />
            ))}
            {YEAR_DOTS.map(({ col, row }) => (
              <div key={`${col}-${row}`} style={{ position: 'absolute', left: col * STEP - 7, top: row * STEP - 7, width: 14, height: 14, borderRadius: 7, background: '#FF0000' }} />
            ))}
            <div style={{ position: 'absolute', left: -1, top: -1, width: w + 2, height: h + 2, border: '3px solid #000000' }} />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Poppins', data: file('assets/fonts/Poppins-Regular.ttf'), weight: 400, style: 'normal' },
        { name: 'Poppins', data: file('assets/fonts/Poppins-Bold.ttf'), weight: 700, style: 'normal' },
      ],
    }
  )
}
