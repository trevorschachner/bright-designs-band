import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'

/** Brand palette, the same names as app/globals.css. */
export const OG = {
  midnight: '#1A244D',
  yellow: '#FFD230',
  lampshade: '#F2E9D0',
  sky: '#45D4FF',
  size: { width: 1200, height: 630 },
} as const

const file = (path: string) => readFileSync(join(process.cwd(), path))

export function ogLogo(): string {
  return `data:image/png;base64,${file('public/logos/brightdesignslogo-main.png').toString('base64')}`
}

/** Poppins for Satori, which cannot use the site's next/font. */
export function ogFonts() {
  return [
    { name: 'Poppins', data: file('assets/fonts/Poppins-Regular.ttf'), weight: 400 as const, style: 'normal' as const },
    { name: 'Poppins', data: file('assets/fonts/Poppins-Bold.ttf'), weight: 700 as const, style: 'normal' as const },
  ]
}

/** Cut at a word so a long title or description ends cleanly. */
export function clip(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 20)).replace(/[\s,;:.—–-]+$/, '') + '…'
}

function titleSize(length: number): number {
  if (length <= 18) return 92
  if (length <= 30) return 78
  if (length <= 48) return 64
  if (length <= 70) return 54
  return 46
}

// A drill form sweeping in from the corner: arcs of dots that grow and shift
// from yellow to sky, the way a set looks on a chart.
const ARCS = [
  { radius: 190, count: 8, dot: 22, color: OG.yellow, opacity: 1 },
  { radius: 290, count: 12, dot: 18, color: '#A6D398', opacity: 0.95 },
  { radius: 390, count: 16, dot: 14, color: OG.sky, opacity: 0.85 },
  { radius: 490, count: 20, dot: 10, color: OG.sky, opacity: 0.45 },
]
const DOTS = ARCS.flatMap(({ radius, count, dot, color, opacity }) =>
  Array.from({ length: count }, (_, i) => {
    const angle = Math.PI * 0.98 + Math.PI * 0.56 * (i / (count - 1))
    return { x: 1215 + radius * Math.cos(angle), y: 655 + radius * Math.sin(angle), dot, color, opacity }
  })
)

/** The gradient ground every card sits on: midnight, lit from two corners. */
export function OgBackdrop() {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: 1200, height: 630, display: 'flex', backgroundImage: 'linear-gradient(135deg, #0A0F2E 0%, #1A244D 48%, #2A3A9A 100%)' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 1200, height: 630, display: 'flex', backgroundImage: 'radial-gradient(circle at 92% 108%, rgba(255,210,48,0.3) 0%, rgba(255,210,48,0) 32%)' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: 1200, height: 630, display: 'flex', backgroundImage: 'radial-gradient(circle at 104% 18%, rgba(69,212,255,0.6) 0%, rgba(69,212,255,0) 50%)' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: 1200, height: 630, display: 'flex', backgroundImage: 'radial-gradient(circle at -6% -10%, rgba(69,212,255,0.22) 0%, rgba(69,212,255,0) 40%)' }} />
    </div>
  )
}

export const OG_ACCENT = `linear-gradient(90deg, ${OG.yellow} 0%, ${OG.sky} 100%)`

interface GenerateOGImageOptions {
  title: string
  description?: string
  /** Small yellow line above the title. */
  subtitle?: string
  /** Short facts under the title: year, level, grade. */
  chips?: string[]
}

export async function generateOGImage({ title, description, subtitle = 'Bright Designs', chips = [] }: GenerateOGImageOptions) {
  const shown = clip(title, 90)
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: 'white', padding: '52px 60px 70px', position: 'relative', fontFamily: 'Poppins' }}>
        <OgBackdrop />
        {DOTS.map((dot, i) => (
          <div key={i} style={{ position: 'absolute', left: dot.x - dot.dot / 2, top: dot.y - dot.dot / 2, width: dot.dot, height: dot.dot, borderRadius: dot.dot, backgroundColor: dot.color, opacity: dot.opacity }} />
        ))}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 12, display: 'flex', backgroundImage: OG_ACCENT }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', backgroundColor: 'white', borderRadius: 18, padding: '10px 18px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ogLogo()} alt="" width={134} height={70} />
          </div>
          <div style={{ display: 'flex', border: '1.5px solid rgba(255,255,255,0.28)', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 999, padding: '8px 20px', fontSize: 21, color: 'rgba(255,255,255,0.86)' }}>brightdesigns.band</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 800 }}>
          <div style={{ display: 'flex', alignSelf: 'flex-start', backgroundColor: OG.yellow, color: OG.midnight, borderRadius: 999, padding: '7px 20px', fontSize: 20, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{subtitle}</div>
          <div style={{ marginTop: 20, fontSize: titleSize(shown.length), fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.03em' }}>{shown}</div>
          {description ? (
            <div style={{ marginTop: 20, fontSize: 27, lineHeight: 1.35, color: 'rgba(255,255,255,0.8)', maxWidth: 700 }}>{clip(description, 96)}</div>
          ) : null}
          {chips.length > 0 ? (
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              {chips.map((chip) => (
                <div key={chip} style={{ display: 'flex', border: '1.5px solid rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 999, padding: '6px 20px', fontSize: 22, color: 'white', textTransform: 'capitalize' }}>{chip}</div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    ),
    { ...OG.size, fonts: ogFonts() }
  )
}
