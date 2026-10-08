import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * /arrangements/[id] must stay cacheable: reading cookies (directly or via
 * the cookie-bound Supabase server client) would make every request dynamic.
 * A static check on the source, so it holds without rendering the page.
 */

const source = readFileSync(join(process.cwd(), 'app/arrangements/[id]/page.tsx'), 'utf8')

describe('app/arrangements/[id]/page.tsx', () => {
  it('never calls cookies()', () => {
    expect(source).not.toMatch(/cookies\(/)
    expect(source).not.toMatch(/from ['"]next\/headers['"]/)
  })

  it('does not import the cookie-bound Supabase server client', () => {
    expect(source).not.toContain('@/lib/utils/supabase/server')
  })

  it('exports an hourly revalidate', () => {
    expect(source).toMatch(/export const revalidate = 3600\b/)
  })

  it('links to the parent show by slug, never by id', () => {
    expect(source).not.toMatch(/\/shows\/\$\{[^}]*\.id\}/)
    expect(source).toContain('/shows/${parentShow.slug}')
  })
})
