# lib/actions: Server Actions for the admin

Admin writes are Server Actions here. The API write routes they replaced were
deleted in SP3 Task 3. File uploads still use `POST /api/files/sign` +
`POST /api/files` (direct-to-Storage) until Task 4.

| File | Actions | Permission | Invalidates |
| --- | --- | --- | --- |
| `shows.ts` | `createShow`, `updateShow`, `deleteShow`, `setShowTags`, `setFeatured` | `canManageShows` | `invalidateShow(id, slug, previousSlug?)` |
| `tags.ts` | `createTag`, `updateTag`, `deleteTag` | `canManageTags` | `invalidateTags()` |
| `resources.ts` | `createResource`, `updateResource`, `setResourceActive`, `deleteResource` | `canManageResources` | `invalidateResources()` |
| `arrangements.ts` | `createArrangement`, `updateArrangement`, `deleteArrangement`, `reorderArrangements`, `setArrangementTags`, `setArrangementPieces` | `canCreateArrangements` / `canEditArrangements` / `canDeleteArrangements` | `invalidateArrangement(id, showSlug)`; reorder: `invalidateShow` |
| `pieces.ts` | `listPieces`, `createPiece`, `updatePiece`, `deletePiece` | `canEditArrangements` | `invalidatePieces()` |
| `files.ts` | `setShowThumbnail`, `attachYouTube`, `deleteFile` | `canManageShows` / `canCreateArrangements` / `canDeleteFiles` | `invalidateShow` / `invalidateFileOwner(file)` |
| `admin-users.ts` | `listAdminUsers`, `addAdminUser`, `setAdminUserRole`, `removeAdminUser` | `canManageUsers` | (none: not public) |

## Writing an action

```ts
'use server'
const runUpdateTag = guarded('canManageTags', updateTagSchema, async (data, { db }) => {
  const row = await db.transaction(async (tx) => { /* lock, check, write */ })
  return { data: toResult(row), invalidate: () => invalidateTags() }
}, 'updateTag')

export async function updateTag(input: UpdateTagInput) {
  return runUpdateTag(input)
}
```

- **Use `guarded()` (`_guarded.ts`).** It runs `guard(permission)`, then
  `schema.safeParse`, then your function with `{ email, db }`, and maps
  anything thrown. A Server Action is a public POST endpoint: the admin page
  being protected protects nothing here.
- **The schema is strict.** `guarded()` refuses a non-strict `z.object` when
  the module loads. It inspects only a top-level `ZodObject`: a schema wrapped
  in `.transform()`/`.refine()`/`z.preprocess` (ZodEffects), or a nested
  object, is not checked, so make those strict yourself.
- **Export plain `async function`s** from the `'use server'` file, each
  calling its `guarded` runner. Positional signatures (`deleteShow(id)`) are
  fine; pack them into the schema's object.
- **Open a transaction only when there is more than one statement**, or a
  read that must hold a lock (`select ... for update`). Single statements and
  reads do not need one.
- **Return `{ data, invalidate }`; never call the invalidate helper yourself.**
  `guarded` runs `invalidate` after `fn` resolves (after commit), so a
  rolled-back write never purges the cache. It runs outside the error mapping:
  if invalidation throws, it is logged and reported and the result is still
  `ok(data)`, because the write committed. Exactly one helper from
  `lib/services/invalidate.ts` per action.
- **Return JSON-safe data.** The result is serialised to the browser.
- **Unknown related ids are `invalid`, not `failed`.** Check them inside the
  transaction before writing and throw `InvalidError` (e.g. show tags:
  `{ path: 'tags', message: 'Unknown tag id 9' }`), rather than letting a
  foreign-key error surface.

## The result type (`result.ts`)

`ActionResult<T>` is `{ ok: true, data }` or `{ ok: false, error, issues? }`,
with `error` one of:

| error | Meaning | Comes from |
| --- | --- | --- |
| `forbidden` | No session, or the role lacks the permission | `guard()` (401/403) |
| `invalid` | Input failed the schema, or `InvalidError` | zod issues (`path`, schema-authored `message`) |
| `not_found` | The row does not exist | `throw new NotFoundError()` |
| `conflict` | A unique constraint (slug, tag name) | Postgres `23505`, on the error or its `cause` |
| `stale` | The row changed since the caller loaded it | `throw new StaleError()` / `assertFresh()` |
| `failed` | Anything else, including an auth outage (`guard()` 5xx) | logged with `reportError` |

**Never return an error's message.** Database messages carry SQL, constraint
names and row values. `guarded()` returns only the vocabulary above; the real
error goes to `reportError` (console + PostHog). Note drizzle-orm 0.44 wraps
driver errors in `DrizzleQueryError`, so the SQLSTATE is on `error.cause.code`;
`postgresCode()` walks the cause chain.

## Concurrency

Editors that save a whole row send back the `updatedAt` they loaded (ISO
string) as a required field. The action, inside its transaction:

1. `select updated_at ... for update` on the row (blocks a concurrent save
   until this one commits);
2. `assertFresh(stored, submitted)`: different instant → `StaleError` →
   `stale`, nothing written;
3. writes with `updatedAt: new Date()`, and returns the new `updatedAt` for the
   caller's next save.

Compared to the millisecond: Postgres keeps microseconds, but every value the
browser holds passed through a JS `Date`, which truncates both sides alike.

Single-field toggles from list views (`setFeatured`, `setShowTags`,
`setResourceActive`) are last-writer-wins and take no `updatedAt`, but still
bump it, so an editor open on the same row gets `stale` instead of undoing the
toggle. `updated_at` is set by the actions, not by a database trigger; any new
writer must set it too.

Tables: `shows`, `resources` (existing `updated_at`), `tags`, `arrangements`
(added in `drizzle/0003_slug_redirects_updated_at.sql`).

`setShowThumbnail` and `deleteFile` (when it clears the show's art) bump the
show's `updated_at` and return it, so the editor that called them keeps
saving without a `stale`. `reorderArrangements` and `setArrangementPieces` do
not bump anything: the order lives in `show_arrangements`, the credits in
`arrangement_pieces`.

`deleteFile` removes the Storage object first and deletes the row only if
Storage accepted the remove; a refusal is `failed` and the row stays, so the
object is never orphaned by a half-done delete.

## Slugs and redirects

`updateShow` changes a slug only when `slug` is sent. On a change it records
the previous slug in `slug_redirects` and deletes any redirect row whose old
slug is the new one (a live slug never also redirects). `createShow` skips
slugs that a show holds or that redirect, and releases a redirect row on the
slug it takes, too. `/shows/[slug]` resolves a miss in
this order: exact slug → `getSlugRedirect` (308) → normalised form (308) →
`notFound()`.

## Deploying

`drizzle/0003_slug_redirects_updated_at.sql` (and
`drizzle/migrations/2026-10-08_slug_redirects_rls.sql`) must be applied with
this code.

- `getSlugRedirect` tolerates a missing `slug_redirects` table (42P01): no
  redirect, one console.error per process, so public `/shows/<miss>` still 404s.
- `getTagsForAdmin` selects `tags.updated_at`: **the admin tag pages error
  until 0003 is applied.** So do `updateTag` and every action that writes or
  reads `updated_at` on tags.

## Tests

`__tests__/fake-db.ts` is a recording stand-in for the Drizzle client: every
awaited chain is logged as an op and answered per table and kind, and
`transaction` logs begin/commit/rollback, so tests can assert what was
written, what was not, and that invalidation came after the commit.
