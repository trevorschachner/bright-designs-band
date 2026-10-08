#!/usr/bin/env tsx
/**
 * Remove expired pending uploads (pending_uploads.expires_at in the past,
 * i.e. signed more than 24 h ago and never completed) and their objects.
 *
 * For each expired row: remove the object if it is there, confirm it is gone
 * (service-role list, which RLS cannot hide), then delete the row. A row whose
 * object could not be removed is kept for the next run.
 *
 *   npx tsx scripts/cleanup-pending-uploads.ts           # dry run: print what would go
 *   npx tsx scripts/cleanup-pending-uploads.ts --apply   # remove objects + rows
 *
 * Not run by agents. Needs DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import { connect, hasFlag, objectExists, serviceClient } from './_storage-common'

async function main() {
  const apply = hasFlag('--apply')
  const db = connect()
  try {
    const { rows } = await db.query(
      `select id, bucket, path, created_by, created_at
         from pending_uploads
        where expires_at < now()
        order by created_at`
    )
    console.log(`${rows.length} expired pending upload(s).`)
    for (const r of rows) console.log(`  ${r.id}  ${r.bucket}/${r.path}  by ${r.created_by} at ${new Date(r.created_at as string).toISOString()}`)
    if (!apply) {
      console.log('\nDry run. Re-run with --apply to remove them.')
      return
    }
    if (rows.length === 0) return

    const client = serviceClient()
    let objectsRemoved = 0
    let rowsDeleted = 0
    let kept = 0
    for (const r of rows) {
      const bucket = r.bucket as string
      const path = r.path as string
      // Lock the row (skipping one a completeUpload holds right now) and
      // re-check expiry inside the transaction, so an upload completing
      // concurrently is never cleaned away under it.
      await db.query('begin')
      try {
        const { rowCount } = await db.query(
          'select 1 from pending_uploads where id = $1 and expires_at < now() for update skip locked',
          [r.id]
        )
        if (!rowCount) {
          await db.query('rollback')
          console.log(`  skip ${r.id}: completed, locked or no longer expired`)
          continue
        }
        if ((await objectExists(client, bucket, path)).present) {
          const { error } = await client.storage.from(bucket).remove([path])
          if (error) throw new Error(error.message)
          if ((await objectExists(client, bucket, path)).present) throw new Error('object still there after remove')
          objectsRemoved++
        }
        await db.query('delete from pending_uploads where id = $1 and expires_at < now()', [r.id])
        await db.query('commit')
        rowsDeleted++
      } catch (error) {
        await db.query('rollback')
        kept++
        console.error(`  kept ${r.id}: ${(error as Error).message}`)
      }
    }
    console.log(`\nRemoved ${objectsRemoved} object(s), deleted ${rowsDeleted} row(s), kept ${kept}.`)
  } finally {
    await db.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
