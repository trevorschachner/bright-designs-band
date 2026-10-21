#!/usr/bin/env tsx
/**
 * Owner answers of 2026-10-12, applied to show data. Idempotent.
 *
 *   npx tsx scripts/seo/apply-owner-answers.ts          # dry run: print the plan
 *   npx tsx scripts/seo/apply-owner-answers.ts --apply  # write, in one transaction
 *
 * - We do not resell drill: program notes say drill is not included (credits stay),
 *   and "drill" comes off each show's includes list (the "What's included" badges).
 * - Make Some Noise is Travelers Rest's indoor winds show; Apex was written for New Bern.
 * - Gold Rush, Off the Rails, Lunch Atop A Skyscraper and Dot by Dot are small-band shows.
 */
import { withDb, type Sql } from '../_common'

const NOT_INCLUDED = 'Drill is not included; the original drill'

/** Drops "drill" from a comma-separated includes list. Exported for tests. */
export function dropDrill(includes: string): string {
  return includes.split(',').map((s) => s.trim()).filter((s) => s && s !== 'drill').join(', ')
}

/** Rewrites every "drill can be adapted" sentence. Exported for tests. */
export function rewriteDrill(notes: string): string {
  return notes
    .replace(
      /Drill and program coordination for the original season were by ([^,.;]+), and the drill can be adapted to your (?:numbers|floor)/g,
      `${NOT_INCLUDED} and program coordination were by $1`,
    )
    .replace(
      /Drill and program coordination for ([^,.;]+?) were by ([^,.;]+), and the drill can be adapted to your (?:numbers|floor)/g,
      `${NOT_INCLUDED} and program coordination for $1 were by $2`,
    )
    .replace(/Drill for ([^,.;]+?) was written by ([^,.;]+?) and can be adapted to your numbers/g, `${NOT_INCLUDED} for $1 was written by $2`)
    .replace(/Drill was written by ([^,.;]+?) and can be adapted to your numbers/g, `${NOT_INCLUDED} was written by $1`)
}

const NOTE_EDITS: Record<string, [string, string][]> = {
  apex: [
    ['Apex is an intermediate show running 7:30, first performed in 2023.', 'Apex is an intermediate show running 7:30, written for New Bern High School in 2023.'],
    [`${NOT_INCLUDED} was written by Richard Hinshaw`, `${NOT_INCLUDED} for New Bern was written by Richard Hinshaw`],
  ],
  'make-some-noise': [
    [
      'A celebration of sound in every form, from clicks and snaps to full-band explosions: Make Some Noise is an intermediate show running 7:30, first performed in 2025.',
      "An indoor winds show about sound in every form, from clicks and snaps to the full ensemble at once: Make Some Noise was written for Travelers Rest High School's 2025 winter ensemble, at an intermediate level, running 7:30.",
    ],
    [
      'written for a medium-sized band with a brass section that can swing.',
      'written for a winter wind ensemble with a brass section that can swing, in a gym rather than a stadium.',
    ],
  ],
}

const COMMISSIONED: Record<string, string> = {
  'make-some-noise': 'Travelers Rest High School',
  apex: 'New Bern High School',
}

const TAGS: Record<string, string[]> = {
  'make-some-noise': ['Indoor Winds'],
  'gold-rush': ['Small Band'],
  'off-the-rails': ['Small Band'],
  'lunch-atop-a-skyscraper': ['Small Band'],
  'dot-by-dot': ['Small Band'],
}

async function main() {
  const apply = process.argv.includes('--apply')
  await withDb(async ({ sql }) => {
    const run = async (db: Sql) => {
      const rows = await db<{ id: number; slug: string; program_notes: string | null; commissioned: string | null; includes: string | null }[]>`
        select id, slug, program_notes, commissioned, includes from shows`
      const bySlug = new Map(rows.map((r) => [r.slug, r]))
      let notes = 0
      for (const r of rows) {
        if (!r.program_notes) continue
        let next = rewriteDrill(r.program_notes)
        for (const [from, to] of NOTE_EDITS[r.slug] ?? []) {
          if (next.includes(from)) next = next.replace(from, to)
          else if (!next.includes(to)) throw new Error(`${r.slug}: expected text not found: ${from.slice(0, 50)}…`)
        }
        if (/can be adapted to your/i.test(next)) throw new Error(`${r.slug}: drill sentence left unrewritten`)
        if (next === r.program_notes) continue
        notes++
        console.log(`notes  ${r.slug}`)
        if (apply) await db`update shows set program_notes = ${next}, updated_at = now() where id = ${r.id}`
      }
      let badges = 0
      for (const r of rows) {
        if (!r.includes) continue
        const next = dropDrill(r.includes)
        if (next === r.includes) continue
        badges++
        if (apply) await db`update shows set includes = ${next || null}, updated_at = now() where id = ${r.id}`
      }
      console.log(`includes: "drill" ${apply ? 'removed from' : 'to remove from'} ${badges} shows`)
      for (const [slug, school] of Object.entries(COMMISSIONED)) {
        const r = bySlug.get(slug)
        if (!r) throw new Error(`Unknown show: ${slug}`)
        if (r.commissioned === school) continue
        console.log(`school ${slug}: ${r.commissioned ?? '(none)'} -> ${school}`)
        if (apply) await db`update shows set commissioned = ${school}, updated_at = now() where id = ${r.id}`
      }
      let links = 0
      for (const [slug, names] of Object.entries(TAGS)) {
        const r = bySlug.get(slug)
        if (!r) throw new Error(`Unknown show: ${slug}`)
        for (const name of names) {
          const [tag] = await db<{ id: number }[]>`select id from tags where name = ${name}`
          if (!tag) throw new Error(`Unknown tag: ${name}`)
          const [exists] = await db`select 1 from shows_to_tags where show_id = ${r.id} and tag_id = ${tag.id}`
          if (exists) continue
          links++
          console.log(`tag    ${slug} + ${name}`)
          if (apply) await db`insert into shows_to_tags (show_id, tag_id) values (${r.id}, ${tag.id}) on conflict do nothing`
        }
      }
      console.log(`\n${apply ? 'Applied' : 'Dry run'}: ${notes} program notes, ${badges} includes lists, ${links} tag links.${apply ? '' : ' Re-run with --apply to write.'}`)
    }
    if (apply) await sql.begin(async (tx) => { await run(tx as unknown as Sql) })
    else await run(sql)
  })
}

if (require.main === module) main().catch((e) => { console.error(`\nError: ${e instanceof Error ? e.message : e}`); process.exit(1) })
