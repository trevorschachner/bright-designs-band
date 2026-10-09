#!/usr/bin/env tsx
/**
 * Create the theme tags and link shows to them. Idempotent.
 *
 *   npx tsx scripts/seo/apply-theme-tags.ts           # dry run: print the plan
 *   npx tsx scripts/seo/apply-theme-tags.ts --apply   # write
 *
 * Without DATABASE_URL, prints the plan from the JSON only.
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import postgres from 'postgres'

config({ path: resolve(process.cwd(), '.env.local') })

const mapping = JSON.parse(
  readFileSync(resolve(__dirname, 'theme-tags.json'), 'utf8'),
) as { themes: string[]; shows: Record<string, string[]> }

async function main() {
  const apply = process.argv.includes('--apply')
  const url = process.env.DATABASE_URL
  const entries = Object.entries(mapping.shows)

  if (!url) {
    console.log('DATABASE_URL not set: printing the plan from the JSON only.\n')
    console.log(`Tags (${mapping.themes.length}): ${mapping.themes.join(', ')}\n`)
    for (const [slug, themes] of entries) console.log(`${slug.padEnd(28)} -> ${themes.join(', ')}`)
    console.log(`\n${entries.length} shows, ${mapping.themes.length} tags. Nothing written.`)
    return
  }

  const sql = postgres(url, { max: 1, prepare: false, ssl: process.env.NODE_ENV === 'production' ? 'require' : 'prefer' })
  try {
    const existingTags = await sql<{ id: number; name: string }[]>`select id, name from tags where name in ${sql(mapping.themes)}`
    const tagIds = new Map(existingTags.map((t) => [t.name, t.id]))
    const newTags = mapping.themes.filter((t) => !tagIds.has(t))

    console.log(`Mode: ${apply ? 'APPLY' : 'dry run'}`)
    console.log(`Tags: ${tagIds.size} exist, ${newTags.length} ${apply ? 'created' : 'to create'}${newTags.length ? ` (${newTags.join(', ')})` : ''}\n`)

    if (apply) {
      for (const name of newTags) {
        await sql`insert into tags (name) values (${name}) on conflict (name) do nothing`
      }
      const rows = await sql<{ id: number; name: string }[]>`select id, name from tags where name in ${sql(mapping.themes)}`
      for (const r of rows) tagIds.set(r.name, r.id)
    }

    const showRows = await sql<{ id: number; slug: string }[]>`select id, slug from shows where slug in ${sql(entries.map(([s]) => s))}`
    const showIds = new Map(showRows.map((s) => [s.slug, s.id]))

    let found = 0
    let missing = 0
    let linksAdded = 0
    let linksSkipped = 0
    for (const [slug, themes] of entries) {
      const showId = showIds.get(slug)
      if (showId === undefined) {
        console.warn(`WARN ${slug.padEnd(28)} unknown slug, skipped`)
        missing++
        continue
      }
      found++
      const results: string[] = []
      for (const theme of themes) {
        const tagId = tagIds.get(theme)
        let already = false
        if (tagId !== undefined) {
          const ex = await sql`select 1 from shows_to_tags where show_id = ${showId} and tag_id = ${tagId}`
          already = ex.length > 0
        }
        if (already) { linksSkipped++; results.push(`${theme}: skipped`); continue }
        if (apply) {
          await sql`insert into shows_to_tags (show_id, tag_id) values (${showId}, ${tagId!}) on conflict do nothing`
        }
        linksAdded++
        results.push(`${theme}: ${apply ? 'added' : 'would add'}`)
      }
      console.log(`${slug.padEnd(28)} ${results.join('; ')}`)
    }

    console.log(`\nShows found: ${found}, missing: ${missing}. Links ${apply ? 'added' : 'to add'}: ${linksAdded}, already present: ${linksSkipped}.`)
    if (apply) console.log('Cached reads expire within 1 hour (revalidate = 3600); trigger a Netlify deploy to refresh sooner.')
    else console.log('Dry run: nothing written. Re-run with --apply to write.')
  } finally {
    await sql.end()
  }
}

main().catch((e) => { console.error(`\nError: ${e instanceof Error ? e.message : e}`); process.exit(1) })
