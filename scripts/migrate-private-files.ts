#!/usr/bin/env tsx
/**
 * Move existing private files (files.is_public = false) from the public bucket
 * to the private bucket, so their public URLs stop working.
 *
 * For each row whose url is still a public URL (not /api/files/<id>/download):
 *   1. copy the object public → private, same key (storage_path is unchanged:
 *      it is relative to the root prefix, and the key is the same in both);
 *   2. verify the copy exists in the private bucket with the same size;
 *   3. rewrite files.url to /api/files/<id>/download (lib/storage.ts reads
 *      that as "in the private bucket"), recorded in the manifest;
 *   4. remove the public original and verify it is gone.
 * A step that fails stops that file; earlier files stay done and recorded.
 *
 * Skipped (printed): YouTube rows (no object), rows whose public URL is used
 * by a show / resource / arrangement column (moving would break that page),
 * and rows whose object is missing from the public bucket.
 *
 * Usage (not run by agents):
 *   npx tsx scripts/migrate-private-files.ts                 # dry run: print the plan
 *   npx tsx scripts/migrate-private-files.ts --apply         # move + rewrite
 *   npx tsx scripts/migrate-private-files.ts --revert scripts/.private-files-migration-<ts>.json          # plan only
 *   npx tsx scripts/migrate-private-files.ts --revert scripts/.private-files-migration-<ts>.json --apply  # revert
 *
 * Needs DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL and (for --apply / --revert)
 * SUPABASE_SERVICE_ROLE_KEY in .env.local. The private bucket must exist.
 */
import { readFile, writeFile } from 'fs/promises'
import { resolve } from 'path'
import { REFERENCING_COLUMNS } from '../lib/media/optimize-plan'
import {
  connect,
  downloadRoute,
  flagValue,
  hasFlag,
  isDownloadRoute,
  objectExists,
  PRIVATE_BUCKET,
  PUBLIC_BUCKET,
  serviceClient,
  withRootPrefix,
  type Db,
} from './_storage-common'

type Entry = {
  id: number
  storagePath: string
  oldUrl: string
  newUrl: string
  /** The public original was removed (revert must copy it back first). */
  sourceRemoved: boolean
}
type Manifest = { createdAt: string; publicBucket: string; privateBucket: string; entries: Entry[] }

type Candidate = { id: number; storagePath: string; url: string; fileType: string; fileSize: number }

async function candidates(db: Db): Promise<Candidate[]> {
  const { rows } = await db.query(
    `select id, storage_path, url, file_type, file_size
       from files
      where is_public = false
      order by id`
  )
  return rows.map((r) => ({
    id: r.id as number,
    storagePath: r.storage_path as string,
    url: r.url as string,
    fileType: r.file_type as string,
    fileSize: r.file_size as number,
  }))
}

/** Columns outside `files` that hold this exact URL. */
async function referencedBy(db: Db, url: string): Promise<string[]> {
  const hits: string[] = []
  for (const { table, column } of REFERENCING_COLUMNS) {
    // Identifiers are a hardcoded constant (assertSafeIdentifier in optimize-plan).
    const { rowCount } = await db.query(`select 1 from ${table} where ${column} = $1`, [url])
    if (rowCount) hits.push(`${table}.${column}`)
  }
  return hits
}

/**
 * Undo a run from its manifest. Dry run unless --apply. Per entry, errors are
 * caught and reported, and the entry is left as it is:
 *   1. if the public original was removed, copy the private object back and
 *      verify it;
 *   2. set files.url back, only if it is still the download route this run
 *      wrote (rowCount 0 = the row changed or is gone: skip, keep the
 *      private copy, since the app may be serving it);
 *   3. remove the private copy.
 */
async function revert(db: Db, manifestPath: string, apply: boolean): Promise<void> {
  const manifest: Manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  console.log(`${apply ? 'Reverting' : 'Would revert'} ${manifest.entries.length} file(s) from ${manifestPath}\n`)
  if (!apply) {
    for (const entry of manifest.entries) {
      console.log(`  #${entry.id}  url ${entry.newUrl} -> ${entry.oldUrl}${entry.sourceRemoved ? `  (copy back to "${manifest.publicBucket}" first)` : ''}`)
    }
    console.log('\nDry run. Re-run with --revert <manifest> --apply to revert.')
    return
  }

  const client = serviceClient()
  let reverted = 0
  let skipped = 0
  let failed = 0
  for (const entry of manifest.entries) {
    const key = withRootPrefix(entry.storagePath)
    try {
      if (entry.sourceRemoved && !(await objectExists(client, manifest.publicBucket, key)).present) {
        const { error } = await client.storage.from(manifest.privateBucket).copy(key, key, { destinationBucket: manifest.publicBucket })
        if (error) throw new Error(`copy back to "${manifest.publicBucket}" failed: ${error.message}`)
        if (!(await objectExists(client, manifest.publicBucket, key)).present) throw new Error('copy back not found')
      }
      const { rowCount } = await db.query('update files set url = $1, updated_at = now() where id = $2 and url = $3', [entry.oldUrl, entry.id, entry.newUrl])
      if (!rowCount) {
        skipped++
        console.log(`  skip #${entry.id}: the row no longer has url ${entry.newUrl}; private copy kept`)
        continue
      }
      const { error } = await client.storage.from(manifest.privateBucket).remove([key])
      if (error) console.warn(`  #${entry.id}: reverted, but the private copy was not removed (${error.message}); find-orphan-files will list it`)
      reverted++
      console.log(`  reverted #${entry.id} -> ${entry.oldUrl}`)
    } catch (error) {
      failed++
      console.error(`  FAILED #${entry.id}: ${(error as Error).message} (left as is)`)
    }
  }
  console.log(`\nReverted ${reverted}, skipped ${skipped}, failed ${failed}.`)
  if (failed) process.exitCode = 1
}

async function main() {
  const apply = hasFlag('--apply')
  const revertPath = flagValue('--revert')
  const db = connect()
  try {
    if (revertPath) return await revert(db, revertPath, apply)

    const rows = await candidates(db)
    const todo: Candidate[] = []
    let alreadyMoved = 0
    for (const row of rows) {
      if (row.fileType === 'youtube') continue
      if (isDownloadRoute(row.url)) {
        alreadyMoved++
        continue
      }
      const refs = await referencedBy(db, row.url)
      if (refs.length > 0) {
        console.log(`  skip #${row.id} ${row.storagePath}: its public URL is used by ${refs.join(', ')}`)
        continue
      }
      todo.push(row)
    }

    console.log(`\n${rows.length} private row(s): ${alreadyMoved} already in "${PRIVATE_BUCKET}", ${todo.length} to move from "${PUBLIC_BUCKET}".\n`)
    for (const row of todo) console.log(`  #${row.id}  ${withRootPrefix(row.storagePath)}  (${row.fileSize} B)`)

    if (!apply) {
      console.log('\nDry run. Re-run with --apply to move them.')
      return
    }
    if (todo.length === 0) return

    const client = serviceClient()
    const manifestPath = resolve(process.cwd(), `scripts/.private-files-migration-${Date.now()}.json`)
    const manifest: Manifest = { createdAt: new Date().toISOString(), publicBucket: PUBLIC_BUCKET, privateBucket: PRIVATE_BUCKET, entries: [] }
    const save = () => writeFile(manifestPath, JSON.stringify(manifest, null, 2))
    await save()

    let moved = 0
    let failed = 0
    for (const row of todo) {
      const key = withRootPrefix(row.storagePath)
      try {
        const source = await objectExists(client, PUBLIC_BUCKET, key)
        if (!source.present) {
          console.log(`  skip #${row.id}: not in "${PUBLIC_BUCKET}" (see find-orphan-files)`)
          continue
        }
        const target = await objectExists(client, PRIVATE_BUCKET, key)
        if (!target.present) {
          const { error } = await client.storage.from(PUBLIC_BUCKET).copy(key, key, { destinationBucket: PRIVATE_BUCKET })
          if (error) throw new Error(`copy failed: ${error.message}`)
        }
        const copied = await objectExists(client, PRIVATE_BUCKET, key)
        if (!copied.present || (source.size !== null && copied.size !== source.size)) {
          throw new Error(`copy not verified (size ${copied.size} vs ${source.size})`)
        }

        const entry: Entry = { id: row.id, storagePath: row.storagePath, oldUrl: row.url, newUrl: downloadRoute(row.id), sourceRemoved: false }
        const { rowCount } = await db.query('update files set url = $1, updated_at = now() where id = $2 and url = $3', [entry.newUrl, row.id, row.url])
        if (!rowCount) throw new Error('row changed under the script; left as is')
        manifest.entries.push(entry)
        await save()

        const { error: removeError } = await client.storage.from(PUBLIC_BUCKET).remove([key])
        if (removeError) throw new Error(`moved, but the public original was not removed: ${removeError.message}`)
        if ((await objectExists(client, PUBLIC_BUCKET, key)).present) throw new Error('moved, but the public original is still there')
        entry.sourceRemoved = true
        await save()
        moved++
        console.log(`  moved #${row.id}`)
      } catch (error) {
        failed++
        console.error(`  FAILED #${row.id}: ${(error as Error).message}`)
      }
    }

    console.log(`\nMoved ${moved}, failed ${failed}.`)
    console.log(`Manifest: ${manifestPath}`)
    console.log(`Revert with: npx tsx scripts/migrate-private-files.ts --revert ${manifestPath} --apply`)
  } finally {
    await db.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
