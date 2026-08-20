#!/usr/bin/env tsx
/**
 * Re-encode oversized Supabase Storage assets to cut cached egress.
 *
 *   PNG posters  -> WebP q82, max width 1920   (~88 MB -> ~4 MB)
 *   WAV audio    -> MP3 192k VBR               (~112 MB -> ~11 MB)
 *
 * Optimized files are uploaded ALONGSIDE the originals (same path, new
 * extension); originals are never deleted. The database is then repointed at
 * the new objects, and every change is recorded to a manifest so `--revert`
 * can put the database back exactly as it was.
 *
 * Usage:
 *   npx tsx scripts/optimize-media.ts                    # dry run, everything
 *   npx tsx scripts/optimize-media.ts --images           # dry run, images only
 *   npx tsx scripts/optimize-media.ts --audio --apply    # encode + upload + update
 *   npx tsx scripts/optimize-media.ts --revert scripts/.media-migration-<ts>.json
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import { Client } from 'pg'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { mkdtemp, readFile, writeFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import {
  AUDIO_TARGET,
  IMAGE_TARGET,
  planFile,
  planUrlRewrites,
  type FilePlan,
  type FileRow,
  type OptimizationTarget,
} from '../lib/media/optimize-plan'

config({ path: resolve(process.cwd(), '.env.local') })

const execFileAsync = promisify(execFile)

const WEBP_QUALITY = 82
const MAX_IMAGE_WIDTH = 1920
const MP3_VBR_QUALITY = '2' // ffmpeg -q:a 2 ~= 192k VBR

const STORAGE_BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET?.trim() || 'Bright Designs'
const STORAGE_ROOT_PREFIX = (process.env.NEXT_PUBLIC_STORAGE_ROOT_PREFIX?.trim() || 'files').replace(/^\/+|\/+$/g, '')

const withRootPrefix = (path: string): string => `${STORAGE_ROOT_PREFIX}/${String(path || '').replace(/^\/+/, '')}`

type ManifestEntry = FilePlan & { newFileSize: number }
type Manifest = { createdAt: string; entries: ManifestEntry[] }

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(1)} ${units[unit]}`
}

function parseArgs(argv: string[]) {
  const apply = argv.includes('--apply')
  const revertIndex = argv.indexOf('--revert')
  const revert = revertIndex === -1 ? null : argv[revertIndex + 1]
  if (revertIndex !== -1 && !revert) {
    throw new Error('--revert requires a path to a manifest file')
  }
  const wantsImages = argv.includes('--images')
  const wantsAudio = argv.includes('--audio')
  // Neither flag means "do both".
  const targets: OptimizationTarget[] = []
  if (wantsImages || !wantsAudio) targets.push(IMAGE_TARGET)
  if (wantsAudio || !wantsImages) targets.push(AUDIO_TARGET)
  return { apply, revert, targets }
}

async function encodeImage(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer()
}

async function encodeAudio(input: Buffer): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), 'optimize-media-'))
  try {
    const inputPath = join(dir, 'in.wav')
    const outputPath = join(dir, 'out.mp3')
    await writeFile(inputPath, input)
    await execFileAsync('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-y',
      '-i', inputPath,
      '-codec:a', 'libmp3lame',
      '-q:a', MP3_VBR_QUALITY,
      outputPath,
    ])
    return await readFile(outputPath)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

async function assertFfmpegAvailable(): Promise<void> {
  try {
    await execFileAsync('ffmpeg', ['-version'])
  } catch {
    throw new Error('ffmpeg is not installed. Run `brew install ffmpeg`, or pass --images to skip audio.')
  }
}

async function fetchCandidates(db: Client, target: OptimizationTarget): Promise<FilePlan[]> {
  const { rows } = await db.query(
    `select id, storage_path, url, original_name, file_name, mime_type, file_size
       from files
      where lower(storage_path) like $1
      order by file_size desc`,
    [`%.${target.sourceExt}`]
  )
  const toRow = (r: Record<string, unknown>): FileRow => ({
    id: r.id as number,
    storagePath: r.storage_path as string,
    url: r.url as string,
    originalName: r.original_name as string,
    fileName: r.file_name as string,
    mimeType: r.mime_type as string,
    fileSize: r.file_size as number,
  })
  return rows.map(toRow).map((row) => planFile(row, target)).filter((p): p is FilePlan => p !== null)
}

/** Repoint the files row and every column that referenced the old URL. */
async function applyPlan(db: Client, entry: ManifestEntry): Promise<void> {
  await db.query('begin')
  try {
    await db.query(
      `update files
          set storage_path = $1, url = $2, mime_type = $3, file_size = $4,
              file_name = $5, original_name = $6, updated_at = now()
        where id = $7`,
      [entry.newStoragePath, entry.newUrl, entry.newMimeType, entry.newFileSize,
       entry.newFileName, entry.newOriginalName, entry.id]
    )
    for (const rewrite of planUrlRewrites(entry.oldUrl, entry.newUrl)) {
      const result = await db.query(
        `update ${rewrite.table} set ${rewrite.column} = $1 where ${rewrite.column} = $2`,
        [rewrite.newValue, rewrite.oldValue]
      )
      // Exact-equality match: any stored variant (cache-buster, different
      // percent-encoding) matches nothing and would otherwise leave the page
      // pointing at the heavy original while this run still reports success.
      if (result.rowCount) {
        console.log(`   rewrote ${rewrite.table}.${rewrite.column} (${result.rowCount} row(s))`)
      }
    }
    await db.query('commit')
  } catch (error) {
    await db.query('rollback')
    throw error
  }
}

async function revert(db: Client, manifestPath: string): Promise<void> {
  const manifest: Manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  console.log(`Reverting ${manifest.entries.length} file(s) from ${manifestPath}\n`)
  for (const entry of manifest.entries) {
    await db.query('begin')
    try {
      await db.query(
        `update files
            set storage_path = $1, url = $2, mime_type = $3, file_size = $4,
                file_name = $5, original_name = $6, updated_at = now()
          where id = $7`,
        [entry.oldStoragePath, entry.oldUrl, entry.oldMimeType, entry.oldFileSize,
         entry.oldFileName, entry.oldOriginalName, entry.id]
      )
      for (const rewrite of planUrlRewrites(entry.newUrl, entry.oldUrl)) {
        await db.query(
          `update ${rewrite.table} set ${rewrite.column} = $1 where ${rewrite.column} = $2`,
          [rewrite.newValue, rewrite.oldValue]
        )
      }
      await db.query('commit')
      console.log(`  reverted #${entry.id} -> ${entry.oldStoragePath}`)
    } catch (error) {
      await db.query('rollback')
      throw error
    }
  }
  console.log('\nDone. Optimized objects were left in the bucket; delete them manually if you want them gone.')
}

async function main() {
  const { apply, revert: revertPath, targets } = parseArgs(process.argv.slice(2))

  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not found in .env.local')

  const db = new Client({ connectionString: process.env.DATABASE_URL })
  await db.connect()

  try {
    if (revertPath) {
      await revert(db, revertPath)
      return
    }

    // Only a real run needs the encoder; dry runs must always be able to plan.
    if (apply && targets.some((t) => t.kind === 'audio')) await assertFfmpegAvailable()

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    if (apply && !serviceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required in .env.local to upload (found in Supabase → Settings → API).')
    }
    if (apply && !supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL not found in .env.local')

    const storage = apply ? createClient(supabaseUrl!, serviceKey!).storage.from(STORAGE_BUCKET) : null

    const plans: FilePlan[] = []
    for (const target of targets) plans.push(...(await fetchCandidates(db, target)))

    if (plans.length === 0) {
      console.log('Nothing to do — no unoptimized files found.')
      return
    }

    console.log(`${apply ? 'APPLYING' : 'DRY RUN'} — ${plans.length} file(s)\n`)

    const entries: ManifestEntry[] = []
    let totalBefore = 0
    let totalAfter = 0

    // Each file commits its own transaction, so the manifest has to be durable
    // after every file — not after the loop. A crash midway through otherwise
    // leaves rows migrated with no way to revert them, which is exactly when
    // the revert path matters most.
    const manifestPath = resolve(process.cwd(), `scripts/.media-migration-${Date.now()}.json`)
    const persistManifest = async () => {
      if (!apply || entries.length === 0) return
      const manifest: Manifest = { createdAt: new Date().toISOString(), entries }
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2))
    }

    try {
    for (const plan of plans) {
      totalBefore += plan.oldFileSize
      console.log(`#${plan.id} ${plan.oldStoragePath}`)
      console.log(`   -> ${plan.newStoragePath}`)

      if (!apply) {
        console.log(`   size ${formatBytes(plan.oldFileSize)} -> (encodes on --apply)`)
        for (const rw of planUrlRewrites(plan.oldUrl, plan.newUrl)) {
          console.log(`   would rewrite ${rw.table}.${rw.column} where it equals the old URL`)
        }
        console.log('')
        continue
      }

      const response = await fetch(plan.oldUrl)
      if (!response.ok) throw new Error(`Failed to download ${plan.oldUrl}: ${response.status} ${response.statusText}`)
      const original = Buffer.from(await response.arrayBuffer())

      const encoded = plan.kind === 'image' ? await encodeImage(original) : await encodeAudio(original)

      const { error: uploadError } = await storage!.upload(withRootPrefix(plan.newStoragePath), encoded, {
        contentType: plan.newMimeType,
        upsert: true,
        cacheControl: '31536000',
      })
      if (uploadError) throw new Error(`Upload failed for ${plan.newStoragePath}: ${uploadError.message}`)

      const entry: ManifestEntry = { ...plan, newFileSize: encoded.length }
      await applyPlan(db, entry)
      entries.push(entry)
      await persistManifest()
      totalAfter += encoded.length

      const saved = ((1 - encoded.length / plan.oldFileSize) * 100).toFixed(1)
      console.log(`   size ${formatBytes(plan.oldFileSize)} -> ${formatBytes(encoded.length)}  (-${saved}%)\n`)
    }
    } finally {
      await persistManifest()
    }

    if (apply && entries.length > 0) {
      console.log(`Total: ${formatBytes(totalBefore)} -> ${formatBytes(totalAfter)}`)
      console.log(`Manifest: ${manifestPath}`)
      console.log(`Revert with: npx tsx scripts/optimize-media.ts --revert ${manifestPath}`)
    } else if (!apply) {
      console.log(`Total current size: ${formatBytes(totalBefore)}`)
      console.log('Re-run with --apply to encode, upload, and update the database.')
    }
  } finally {
    await db.end()
  }
}

main().catch((error) => {
  console.error(`\nError: ${error instanceof Error ? error.message : error}`)
  process.exit(1)
})
