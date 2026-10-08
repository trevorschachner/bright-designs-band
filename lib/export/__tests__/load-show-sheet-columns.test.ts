import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from '../../database/schema'
import { ARRANGEMENT_EXPORT_COLUMNS } from '../load-show-sheet'

// The public CSV export must work on a database that has not run drizzle
// 0003 (which adds arrangements.updated_at and tags.updated_at), so the
// arrangement and tag reads name their columns instead of selecting *.
const source = readFileSync(join(__dirname, '..', 'load-show-sheet.ts'), 'utf8')

describe('show sheet export queries name their columns', () => {
  it('never calls select() without a column map', () => {
    expect(source).not.toMatch(/\.select\(\s*\)\s*\.from\(\s*arrangements\s*\)/)
    expect(source).toMatch(/\.select\(ARRANGEMENT_EXPORT_COLUMNS\)\s*\.from\(arrangements\)/)
  })

  it('loads only the tag name through the relation', () => {
    expect(source).not.toMatch(/tag:\s*true/)
    expect(source).toMatch(/tag:\s*\{\s*columns:\s*\{\s*name:\s*true\s*\}\s*\}/)
  })

  it('the arrangement query SQL has no updated_at', () => {
    const db = drizzle.mock({ schema })
    const { sql } = db.select(ARRANGEMENT_EXPORT_COLUMNS).from(schema.arrangements).toSQL()
    expect(sql).not.toMatch(/updated_at/)
    expect(sql).not.toMatch(/\*/)
    expect(Object.keys(ARRANGEMENT_EXPORT_COLUMNS)).not.toContain('updatedAt')
  })

  it('the shows query loads tag names without tags.updated_at', () => {
    const db = drizzle.mock({ schema })
    const { sql } = db.query.shows
      .findMany({ with: { showsToTags: { with: { tag: { columns: { name: true } } } } } })
      .toSQL()
    expect(sql).not.toContain('"shows_showsToTags_tag"."updated_at"')
    expect(sql).toContain('json_build_array("shows_showsToTags_tag"."name")')
  })
})
