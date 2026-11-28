import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'

/** Brand palette, the same names as app/globals.css. */
export const OG = {
  midnight: '#1A244D',
  yellow: '#FFD230',
  lampshade: '#F2E9D0',
  sky: '#45D4FF',
  charcoal: '#242323',
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
  if (length <= 16) return 104
  if (length <= 28) return 84
  if (length <= 44) return 68
  if (length <= 64) return 56
  return 46
}

// A page of drill chart, the thing we hand a band: 8 steps to 5 yards, a yard
// line every 8 columns, winds as dots and the battery as squares. It runs off
// the right and bottom edges like a sheet on a desk.
const STEP = 20
const PAPER = { left: 748, top: 104, cols: 23, rows: 27 }
const YARD_LINES = [3, 11, 19]
const YARD_NUMBERS = ['45', '50', '45']
// Two arcs opening toward the front sideline, on the half step where it falls.
const WINDS = [
  ...Array.from({ length: 13 }, (_, i) => ({ col: 2 + i * 1.5, row: 9 - 4.5 * Math.sin((i / 12) * Math.PI) })),
  ...Array.from({ length: 9 }, (_, i) => ({ col: 5 + i * 1.5, row: 13 - 3 * Math.sin((i / 8) * Math.PI) })),
]
const BATTERY = Array.from({ length: 10 }, (_, i) => ({ col: 7 + (i % 5) * 2, row: 17 + Math.floor(i / 5) * 2 }))

function DrillSheet() {
  const width = PAPER.cols * STEP
  const height = PAPER.rows * STEP
  return (
    <div style={{ position: 'absolute', left: PAPER.left, top: PAPER.top, width: width + 6, height: height + 6, display: 'flex', backgroundColor: 'white', borderLeft: `6px solid ${OG.midnight}`, borderTop: `6px solid ${OG.midnight}` }}>
      {Array.from({ length: PAPER.cols }, (_, c) => c + 1).map((c) => {
        const yard = YARD_LINES.includes(c)
        return <div key={`c${c}`} style={{ position: 'absolute', left: c * STEP - (yard ? 1 : 0), top: 0, width: yard ? 3 : 1, height, backgroundColor: yard ? OG.midnight : '#D9DCE6' }} />
      })}
      {Array.from({ length: PAPER.rows }, (_, r) => r + 1).map((r) => (
        <div key={`r${r}`} style={{ position: 'absolute', top: r * STEP, left: 0, height: 1, width, backgroundColor: r % 4 ? '#D9DCE6' : '#9AA1B9' }} />
      ))}
      {YARD_LINES.map((c, i) => (
        <div key={`n${c}`} style={{ position: 'absolute', left: c * STEP + 8, top: 10, display: 'flex', backgroundColor: 'white', padding: '0 4px', fontSize: 22, fontWeight: 700, color: OG.midnight }}>{YARD_NUMBERS[i]}</div>
      ))}
      {WINDS.map(({ col, row }, i) => (
        <div key={`w${i}`} style={{ position: 'absolute', left: col * STEP - 8, top: row * STEP - 8, width: 16, height: 16, borderRadius: 8, backgroundColor: OG.midnight }} />
      ))}
      {BATTERY.map(({ col, row }, i) => (
        <div key={`b${i}`} style={{ position: 'absolute', left: col * STEP - 7, top: row * STEP - 7, width: 14, height: 14, backgroundColor: OG.sky, border: `2px solid ${OG.midnight}` }} />
      ))}
    </div>
  )
}

interface GenerateOGImageOptions {
  title: string
  /** Small caps line above the title: what kind of page this is. */
  subtitle?: string
  /** Short facts under the title: composer, year, level. Set as plain text. */
  chips?: string[]
}

/**
 * The text card. Flat Electric Yellow, Midnight type set left, and a sheet of
 * drill chart: no gradients, glows, shadows or rounded pills.
 */
export async function generateOGImage({ title, subtitle = 'Bright Designs', chips = [] }: GenerateOGImageOptions) {
  const shown = clip(title, 80)
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', backgroundColor: OG.yellow, color: OG.midnight, position: 'relative', fontFamily: 'Poppins' }}>
        <DrillSheet />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 748, padding: '48px 44px 44px 56px' }}>
          <div style={{ display: 'flex', alignSelf: 'flex-start', backgroundColor: 'white', padding: '10px 16px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ogLogo()} alt="" width={134} height={70} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 21, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{subtitle}</div>
            <div style={{ display: 'flex', marginTop: 12, fontSize: titleSize(shown.length), fontWeight: 700, lineHeight: 1.02, letterSpacing: '-0.035em' }}>{shown}</div>
            {chips.length > 0 ? <div style={{ display: 'flex', marginTop: 18, fontSize: 28 }}>{chips.join('  /  ')}</div> : null}
            <div style={{ display: 'flex', marginTop: 28, paddingTop: 14, borderTop: `4px solid ${OG.midnight}`, fontSize: 22, fontWeight: 700 }}>brightdesigns.band</div>
          </div>
        </div>
      </div>
    ),
    { ...OG.size, fonts: ogFonts() }
  )
}
