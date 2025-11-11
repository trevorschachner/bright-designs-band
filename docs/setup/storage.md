## Storage setup and rules

This project uses a single Supabase Storage bucket for all environments, with a fixed root prefix. Follow these rules to avoid confusion and regressions:

- Bucket
  - Use one bucket: `Bright Designs` (exact name).
  - Do not create new buckets for features; use folders (prefixes) instead.
  - Legacy bucket `files` is deprecated; do not write new objects there.

- Root prefix
  - All objects live under the root prefix: `files/`.
  - Database `storagePath` values are always relative to the root prefix (never include bucket name nor `files/`).
  - Examples:
    - DB: `shows/123/image/cover.jpg` → actual object: `Bright Designs/files/shows/123/image/cover.jpg`
    - DB: `show_mp3s/track.mp3` → actual object: `Bright Designs/files/show_mp3s/track.mp3`

- Environment variables
  - `NEXT_PUBLIC_STORAGE_BUCKET`: `Bright Designs`
  - `NEXT_PUBLIC_STORAGE_ROOT_PREFIX`: `files`
  - Never hardcode bucket names in code. Always use the exported constants from `lib/storage.ts`.

- Code conventions
  - Use `STORAGE_BUCKET` and `withRootPrefix(storagePath)` from `lib/storage.ts` for all storage interactions.
  - Never call `supabase.storage.from('<literal>')` with a hardcoded bucket.
  - Keep all path-building logic centralized in `FileStorageService.generateStoragePath`.

- Migration and maintenance
  - To migrate/copy objects, use the deployed Edge Function `migrate-storage`.
    - Invoke URL: `https://<project-ref>.supabase.co/functions/v1/migrate-storage`
    - Headers: `Authorization: Bearer <anon key>`, `Content-Type: application/json`
    - Body (example, dry run):
      ```
      { "action": "migrate", "sourceBucket": "files", "destBucket": "Bright Designs", "sourcePrefix": "", "destPrefix": "files", "dryRun": true }
      ```
    - You can list buckets:
      ```
      { "action": "listBuckets" }
      ```
  - Run a dry run first; then set `"dryRun": false` to execute.

- Testing and previews
  - Previews/staging should reuse the same conventions (single bucket + `files/` prefix). If a different bucket is required, only change via env vars; do not change code.

- Backups
  - Back up the `Bright Designs/files/` prefix periodically before large migrations.


