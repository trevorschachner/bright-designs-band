#!/usr/bin/env tsx
/**
 * Create the theme tags and link shows to them. Idempotent.
 *
 *   npx tsx scripts/seo/apply-theme-tags.ts           # dry run: print the plan
 *   npx tsx scripts/seo/apply-theme-tags.ts --dry-run # same (explicit; no-op, dry run is the default)
 *   npx tsx scripts/seo/apply-theme-tags.ts --apply   # write, in one transaction
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

    const showRows = await sql<{ id: number; slug: string }[]>`select id, slug from shows where slug in ${sql(entries.map(([s]) => s))}`
    const showIds = new Map(showRows.map((s) => [s.slug, s.id]))

    // One read of the existing links, used to compute the plan in both modes.
    const existingLinks = new Set<string>()
    if (showIds.size) {
      const rows = await sql<{ show_id: number; tag_id: number }[]>`select show_id, tag_id from shows_to_tags where show_id in ${sql([...showIds.values()])}`
      for (const r of rows) existingLinks.add(`${r.show_id}:${r.tag_id}`)
    }

    console.log(`Mode: ${apply ? 'APPLY' : 'dry run'}`)
    console.log(`Tags: ${tagIds.size} exist, ${newTags.length} ${apply ? 'created' : 'to create'}${newTags.length ? ` (${newTags.join(', ')})` : ''}\n`)

    let found = 0
    let missing = 0
    let linksAdded = 0
    let linksSkipped = 0
    const lines: string[] = []

    const run = async (db: typeof sql) => {
      if (apply) {
        for (const name of newTags) {
          await db`insert into tags (name) values (${name}) on conflict (name) do nothing`
        }
        const rows = await db<{ id: number; name: string }[]>`select id, name from tags where name in ${sql(mapping.themes)}`
        for (const r of rows) tagIds.set(r.name, r.id)
      }
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
          let added: boolean
          if (apply) {
            if (tagId === undefined) throw new Error(`Tag missing after insert: ${theme}`)
            const ret = await db`insert into shows_to_tags (show_id, tag_id) values (${showId}, ${tagId}) on conflict do nothing returning show_id`
            added = ret.length > 0
          } else {
            added = tagId === undefined || !existingLinks.has(`${showId}:${tagId}`)
          }
          if (added) linksAdded++
          else linksSkipped++
          results.push(`${theme}: ${added ? (apply ? 'added' : 'would add') : 'skipped'}`)
        }
        lines.push(`${slug.padEnd(28)} ${results.join('; ')}`)
      }
    }

    if (apply) await sql.begin(async (tx) => { await run(tx as unknown as typeof sql) })
    else await run(sql)

    for (const l of lines) console.log(l)
    console.log(`\nShows found: ${found}, missing: ${missing}. Links ${apply ? 'added' : 'to add'}: ${linksAdded}, already present: ${linksSkipped}.`)
    if (apply) console.log('Theme tags applied. If the site is already deployed, collection pages refresh within 1 hour (revalidate = 3600); trigger a Netlify deploy to refresh sooner.')
    else console.log('Dry run: nothing written. Re-run with --apply to write.')
  } finally {
    await sql.end()
  }
}

main().catch((e) => { console.error(`\nError: ${e instanceof Error ? e.message : e}`); process.exit(1) })
