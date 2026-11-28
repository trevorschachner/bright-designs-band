import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'
import { COVER, featuredCovers } from '@/lib/og/covers'

/** Brand palette, the same names and values as app/globals.css. */
export const OG = {
  midnight: '#1A244D',
  yellow: '#FFD230',
  lampshade: '#F2E9D0',
  sky: '#45D4FF',
  charcoal: '#242323',
  muted: '#6E6E6E',
  cream: '#FAF7EE',
  line: '#E5E5E5',
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

function titleSize(length: number, narrow: boolean): number {
  if (narrow) {
    if (length <= 14) return 88
    if (length <= 26) return 70
    if (length <= 44) return 58
    return 48
  }
  if (length <= 20) return 96
  if (length <= 34) return 80
  if (length <= 50) return 66
  return 54
}

// Satori has no text-wrap: balance, so a line that would wrap gets a width of
// about half its length and breaks into two even lines, not one long and a stub.
function balancedWidth(text: string): number {
  const estimate = text.length * 15.6
  return estimate <= 820 ? 840 : Math.round(estimate / 2 + 70)
}

/** The faint square grid behind the site's page headers. */
export function OgGrid({ height }: { height: number }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: 1200, height, display: 'flex' }}>
      {Array.from({ length: 29 }, (_, i) => (i + 1) * 40).map((x) => (
        <div key={`x${x}`} style={{ position: 'absolute', left: x, top: 0, width: 1, height, backgroundColor: '#F1F1F3' }} />
      ))}
      {Array.from({ length: Math.floor(height / 40) }, (_, i) => (i + 1) * 40).map((y) => (
        <div key={`y${y}`} style={{ position: 'absolute', top: y, left: 0, height: 1, width: 1200, backgroundColor: '#F1F1F3' }} />
      ))}
    </div>
  )
}

/** The site's header bar: logo left, address right, a hairline under it. */
export function OgHeader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 108, padding: '0 56px', backgroundColor: 'white', borderBottom: `1px solid ${OG.line}` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={ogLogo()} alt="" width={145} height={76} />
      <div style={{ display: 'flex', fontSize: 24, fontWeight: 400, color: OG.charcoal }}>brightdesigns.band</div>
    </div>
  )
}

// Two staggered columns of covers down the right side, running off the bottom
// and under the header the way the catalog scrolls.
const WALL = { left: 612, width: 588, top: 109, height: 511 }
const TILE_GAP = 18
function CoverWall({ covers }: { covers: string[] }) {
  const columns = [covers.filter((_, i) => i % 2 === 0), covers.filter((_, i) => i % 2 === 1)]
  return (
    <div style={{ position: 'absolute', left: WALL.left, top: WALL.top, width: WALL.width, height: WALL.height, display: 'flex', overflow: 'hidden' }}>
      {columns.map((column, c) =>
        column.map((src, r) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${c}-${r}`}
            src={src}
            alt=""
            width={COVER.width}
            height={COVER.height}
            style={{ position: 'absolute', left: 12 + c * (COVER.width + TILE_GAP), top: (c === 0 ? 34 : -58) + r * (COVER.height + TILE_GAP), borderRadius: 10, boxShadow: '0 8px 22px rgba(0,0,0,0.16)' }}
          />
        ))
      )}
    </div>
  )
}

interface GenerateOGImageOptions {
  /** The page's own headline. */
  title: string
  /** Part of the title to set in Clear Sky, as the home page does. */
  highlight?: string
  /** The page's own line under the headline. */
  description?: string
  /** Facts shown as the site's badges: the first outlined, the rest filled. */
  chips?: string[]
  /** A small line above the title. */
  subtitle?: string
  /** Show covers for the right side, as data URLs. Defaults to the featured shows. */
  covers?: string[]
}

/**
 * The text card, in the site's own look: white with the faint grid, the logo
 * bar, a Poppins headline with the grey line under it, and real show covers
 * down the right. With no covers to show, the text is centred like a page header.
 */
export async function generateOGImage({ title, highlight, description, chips = [], subtitle, covers }: GenerateOGImageOptions) {
  const tiles = covers ?? (await featuredCovers())
  const wall = tiles.length >= 3
  const shown = clip(title, 70)
  const lead = highlight && shown.endsWith(highlight) ? shown.slice(0, -highlight.length) : shown
  const size = titleSize(shown.length, wall)
  const blurb = description ? clip(description, wall ? 84 : 92) : null
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'white', color: OG.charcoal, position: 'relative', fontFamily: 'Poppins' }}>
        <OgGrid height={630} />
        {wall ? <CoverWall covers={tiles} /> : null}
        <OgHeader />
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', ...(wall ? { width: WALL.left, padding: '0 28px 8px 56px' } : { alignItems: 'center', padding: '0 70px 12px', textAlign: 'center' }) }}>
          {subtitle ? <div style={{ display: 'flex', marginBottom: 14, fontSize: 24, color: OG.muted }}>{subtitle}</div> : null}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: wall ? 'flex-start' : 'center', fontSize: size, fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.035em', color: highlight ? OG.charcoal : OG.midnight }}>
            {lead.trim().split(' ').map((word, i) => (
              <span key={`l${i}`} style={{ marginRight: size * 0.24 }}>{word}</span>
            ))}
            {lead !== shown
              ? highlight!.split(' ').map((word, i) => (
                  <span key={`h${i}`} style={{ marginRight: size * 0.24, color: OG.sky }}>{word}</span>
                ))
              : null}
          </div>
          {blurb ? (
            <div style={{ display: 'flex', marginTop: 20, maxWidth: wall ? 500 : balancedWidth(blurb), fontSize: wall ? 27 : 30, lineHeight: 1.4, color: OG.muted }}>{blurb}</div>
          ) : null}
          {chips.length > 0 ? (
            <div style={{ display: 'flex', gap: 12, marginTop: 26 }}>
              {chips.map((chip, i) => (
                <div key={chip} style={{ display: 'flex', borderRadius: 999, padding: '6px 22px', fontSize: 24, fontWeight: 700, ...(i === 0 ? { border: `1px solid ${OG.line}`, backgroundColor: 'white', color: OG.charcoal } : { backgroundColor: OG.midnight, color: 'white' }) }}>{chip}</div>
              ))}
            </div>
          ) : null}
        </div>
        <div style={{ display: 'flex', height: 10, backgroundColor: OG.yellow }} />
      </div>
    ),
    { ...OG.size, fonts: ogFonts() }
  )
}
