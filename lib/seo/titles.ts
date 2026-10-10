const BRAND = ' | Bright Designs'
const MAX = 60

// The brief's own examples keep the brand on a 49-character core (66 total)
// and drop it on a 62-character core, so the brand is dropped only when the
// core title alone already passes MAX.
function withBrand(core: string): string {
  return core.length <= MAX ? core + BRAND : core
}

export function showTitle(s: { title: string; difficulty: string | null; year: number | null }): string {
  const level = s.difficulty ? `${s.difficulty} ` : ''
  const year = s.year ? ` (${s.year})` : ''
  return withBrand(`${s.title} – ${level}Marching Band Show${year}`)
}

export function arrangementTitle(a: { title: string; composer: string | null }): string {
  const by = a.composer?.trim() ? ` (${a.composer.trim()})` : ''
  return withBrand(`${a.title}${by} – Marching Band Arrangement`)
}
