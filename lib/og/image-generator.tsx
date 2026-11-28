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
  if (length <= 22) return 84
  if (length <= 40) return 70
  if (length <= 64) return 58
  return 48
}

// A drill form in the corner: three arcs of dots, the way a set looks on a chart.
const ARCS = [
  { radius: 150, count: 7, color: OG.yellow, opacity: 1 },
  { radius: 235, count: 10, color: OG.sky, opacity: 0.9 },
  { radius: 320, count: 13, color: OG.yellow, opacity: 0.45 },
]
const DOTS = ARCS.flatMap(({ radius, count, color, opacity }) =>
  Array.from({ length: count }, (_, i) => {
    const angle = Math.PI + (Math.PI / 2) * (i / (count - 1))
    return { x: 1150 + radius * Math.cos(angle), y: 590 + radius * Math.sin(angle), color, opacity }
  })
)

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
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: OG.midnight, color: 'white', padding: '52px 60px 66px', position: 'relative', fontFamily: 'Poppins' }}>
        {DOTS.map((dot, i) => (
          <div key={i} style={{ position: 'absolute', left: dot.x - 9, top: dot.y - 9, width: 18, height: 18, borderRadius: 9, background: dot.color, opacity: dot.opacity }} />
        ))}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 14, background: OG.yellow }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', background: 'white', borderRadius: 16, padding: '10px 18px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ogLogo()} alt="" width={134} height={70} />
          </div>
          <div style={{ fontSize: 22, color: OG.lampshade, opacity: 0.8 }}>brightdesigns.band</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 760 }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: OG.yellow }}>{subtitle}</div>
          <div style={{ marginTop: 14, fontSize: titleSize(shown.length), fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.02em' }}>{shown}</div>
          {description ? (
            <div style={{ marginTop: 20, fontSize: 27, lineHeight: 1.35, color: '#D1D5DB' }}>{clip(description, 110)}</div>
          ) : null}
          {chips.length > 0 ? (
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              {chips.map((chip) => (
                <div key={chip} style={{ display: 'flex', border: `2px solid ${OG.yellow}`, borderRadius: 999, padding: '6px 20px', fontSize: 22, color: OG.yellow }}>{chip}</div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    ),
    { ...OG.size, fonts: ogFonts() }
  )
}
