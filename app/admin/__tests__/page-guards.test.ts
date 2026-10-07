import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

// The admin layout checks access once per request; each page also checks the
// permission its actions need, so a removed or downgraded user reads nothing
// on their next request even if a page is ever moved out of the layout.
const ADMIN = join(__dirname, '..')

// Accepted exceptions: a client component cannot call guard(); its writes go
// through guarded Server Actions and the layout still gates the route.
const EXCEPTIONS = new Set(['resources/new/page.tsx'])

function pages(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return name === '__tests__' ? [] : pages(p)
    return name === 'page.tsx' ? [p] : []
  })
}

describe('admin page-level guards', () => {
  const all = pages(ADMIN).map(p => relative(ADMIN, p).split('\\').join('/'))

  it('finds the admin pages', () => {
    expect(all).toContain('page.tsx')
    expect(all).toContain('shows/[id]/page.tsx')
  })

  it.each(all.filter(p => !EXCEPTIONS.has(p)))('%s imports guard or requirePermission', p => {
    const src = readFileSync(join(ADMIN, p), 'utf8')
    expect(src).toMatch(/import \{[^}]*\b(guard|requirePermission)\b[^}]*\} from '@\/lib\/auth\/(guard|roles)'/)
    expect(src).toMatch(/await (guard|requirePermission)\(/)
  })

  it('every exception is a client component', () => {
    for (const p of EXCEPTIONS) {
      expect(readFileSync(join(ADMIN, p), 'utf8')).toMatch(/^'use client'/)
    }
  })

  it('the dashboard checks access before reading stats', () => {
    const src = readFileSync(join(ADMIN, 'page.tsx'), 'utf8')
    expect(src.indexOf("guard('canAccessAdmin')")).toBeGreaterThan(-1)
    expect(src.indexOf("guard('canAccessAdmin')")).toBeLessThan(src.indexOf('getDashboardStats()'))
  })
})
