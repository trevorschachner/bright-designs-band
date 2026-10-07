#!/usr/bin/env tsx
/**
 * Report Storage objects with no `files` row, and `files` rows whose object
 * is missing, in both buckets. Prints only; changes nothing.
 *
 * A row's object is expected at <root prefix>/<storage_path> in the bucket its
 * url implies (download route = private bucket, otherwise public; see
 * lib/storage.ts). Objects named by a pending_uploads row are uploads in
 * flight, not orphans, and are listed separately. YouTube rows have no object.
 *
 * Uses the service-role key so RLS cannot hide objects from the listing.
 *
 *   npx tsx scripts/find-orphan-files.ts
 */
import { connect, listAll, PRIVATE_BUCKET, PUBLIC_BUCKET, ROOT_PREFIX, serviceClient, withRootPrefix, bucketForRow } from './_storage-common'

async function main() {
  const db = connect()
  try {
    const client = serviceClient()
    const { rows } = await db.query(`select id, storage_path, url, file_type from files where file_type <> 'youtube' order by id`)

    let pending: { bucket: string; path: string }[] = []
    try {
      pending = (await db.query('select bucket, path from pending_uploads')).rows.map((r) => ({ bucket: r.bucket as string, path: r.path as string }))
    } catch {
      console.log('(pending_uploads does not exist yet; drizzle/0004 not applied)')
    }

    const key = (bucket: string, path: string) => `${bucket}\u0000${path}`
    const expected = new Map<string, number>()
    for (const r of rows) expected.set(key(bucketForRow(r.url), withRootPrefix(r.storage_path as string)), r.id as number)
    const inFlight = new Set(pending.map((p) => key(p.bucket, p.path)))

    const present = new Set<string>()
    const orphans: string[] = []
    const flying: string[] = []
    for (const bucket of [PUBLIC_BUCKET, PRIVATE_BUCKET]) {
      let objects
      try {
        objects = await listAll(client, bucket, ROOT_PREFIX)
      } catch (error) {
        console.log(`(could not list "${bucket}": ${(error as Error).message})`)
        continue
      }
      for (const o of objects) {
        const k = key(bucket, o.path)
        present.add(k)
        if (expected.has(k)) continue
        if (inFlight.has(k)) flying.push(`${bucket}/${o.path}`)
        else orphans.push(`${bucket}/${o.path}  (${o.size ?? '?'} B)`)
      }
    }

    const missing = [...expected.entries()]
      .filter(([k]) => !present.has(k))
      .map(([k, id]) => `#${id}  ${k.replace('\u0000', '/')}`)

    console.log(`\nObjects with no files row (${orphans.length}):`)
    for (const line of orphans) console.log(`  ${line}`)
    console.log(`\nRows whose object is missing (${missing.length}):`)
    for (const line of missing) console.log(`  ${line}`)
    console.log(`\nUploads in flight (pending_uploads) (${flying.length}):`)
    for (const line of flying) console.log(`  ${line}`)
    console.log(`\nChecked ${rows.length} row(s) against "${PUBLIC_BUCKET}" and "${PRIVATE_BUCKET}" under ${ROOT_PREFIX}/. Nothing was changed.`)
  } finally {
    await db.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
