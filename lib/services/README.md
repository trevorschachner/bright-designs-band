# lib/services: the read layer and cache invalidation

Every database read a page or API route makes goes through a function here.
Writes stay in the API routes, and each one ends by calling one helper from
`invalidate.ts`.

| File | What it reads |
| --- | --- |
| `shows.ts` | Featured shows, collections, the `/api/shows` page, show detail, a show's arrangements and files, slugs |
| `arrangements.ts` | The `/api/arrangements` page, arrangement detail, an arrangement's public files |
| `pieces.ts` | Public source-piece credits; admin piece lists |
| `resources.ts` | Active resources; admin list including drafts |
| `tags.ts` | All tags |
| `admin.ts` | Dashboard counts |
| `files.ts` | No reads: `invalidateFileOwner()` routes a file write to its show or arrangement |
| `cache.ts` | `cachedRead()`, the build fallback, `toIso()` |
| `invalidate.ts` | One invalidation helper per entity |

## Caching primitive: `unstable_cache`

We use `unstable_cache`, not `'use cache'`. Decided once for the whole layer.

- In Next 16.4, `'use cache'` is stable only with `cacheComponents: true` turned
  on in `next.config.mjs`. That flag changes how the whole app renders: the
  route segment configs this app uses everywhere (`export const revalidate`,
  `export const dynamic = 'force-dynamic'`) stop being allowed, and every
  uncached read has to sit under a Suspense boundary. That migration is far
  larger than this layer.
- `@netlify/plugin-nextjs` 5.16.2 ships a `'use cache'` handler in its code,
  but its README and changelog do not document `'use cache'` or
  `cacheComponents` as supported. `unstable_cache` and tag revalidation are the
  documented, long-supported path on Netlify.

`unstable_cache` is deprecated in name only. Revisit this when the app moves to
`cacheComponents`. The change is then confined to `cachedRead()` in `cache.ts`.

## Rules

1. **A public read is `cachedRead(key, fn, { tags, atBuildWithoutDb })`.** It is
   cached for 3600 s under `key` plus its JSON-serialised arguments, and tagged.
2. **A read is tagged with every entity it reads, not just its own.** A show
   list that shows arrangement titles carries `arrangements`. A write then only
   has to expire its own entity's tags. Tag names live in `lib/cache-tags.ts`.
3. **Explicit columns, always.** Every query names its columns: `columns: {...}`
   for relational queries, `select({...})` for the query builder. Never
   `select()` with no argument, never `copyrightAmountUsd` in a public read.
4. **One error policy: throw.** Nothing here catches a database error. A
   lookup returns `null` for "no such row", and the page calls `notFound()`. A
   failure reaches the route's catch (500) or `app/error.tsx`. An empty list
   means nothing matched. It never means the query failed.
5. **The one exception is a build without a database.** During `next build`
   with no `DATABASE_URL` (CI) or a masked Supabase env (some Netlify builds),
   `cachedRead` returns `atBuildWithoutDb` without querying or caching. The
   prerendered page is the empty state until the first revalidation or write.
6. **JSON-safe results.** A cache hit comes back through JSON, so services
   return ISO strings for timestamps (`toIso`) and plain objects, not Maps.
7. **Admin reads are uncached.** Functions named `...ForAdmin` call the query
   directly. Routes serve them only after `guard()` passes, with
   `Cache-Control: private, no-store` (`PrivateResponse` / `PRIVATE_HEADERS`).
   The admin UI asks for them with `?admin=true` (shows, tags) or `?all=true`
   (resources), so it sees its own writes. These routes are dynamic route
   handlers, so no `connection()` or `noStore()` call is needed.

## Invalidation

`invalidate.ts` exports one helper per entity. Each one calls
`revalidateTag(tag, { expire: 0 })` for the entity tag and the list tag, then
`revalidatePath` for the detail page(s), `/`, the list page and
`/sitemap.xml`. `{ expire: 0 }` expires the entry immediately. The `'max'`
profile would serve the stale value once more, and the admin UI re-reads
straight after saving.

| Helper | Tags | Paths |
| --- | --- | --- |
| `invalidateShow(id, slug, previousSlug?)` | `show:<id>`, `shows` | `/shows/<slug>` (and the old slug), `/`, `/shows`, `/sitemap.xml` |
| `invalidateArrangement(id, showSlug?)` | `arrangement:<id>`, `arrangements` | `/arrangements/<id>`, `/shows/<showSlug>`, `/`, `/arrangements`, `/sitemap.xml` |
| `invalidateTags()` | `tags` | every `/shows/[slug]` and `/arrangements/[id]` page, `/`, `/shows`, `/arrangements`, `/sitemap.xml` |
| `invalidatePieces()` | `pieces` | same as tags |
| `invalidateResources()` | `resources` | `/resources`, `/`, `/sitemap.xml` |
| `invalidateCatalog()` | all five list tags | the whole site (`/`, layout) |

Which write calls which:

| Route | Helper |
| --- | --- |
| `POST /api/shows` | `invalidateShow` |
| `PUT /api/shows/[id]` (incl. setting the thumbnail) | `invalidateShow` (with the previous slug) |
| `DELETE /api/shows/[id]` | `invalidateShow` |
| `POST /api/arrangements` | `invalidateArrangement` (parent show slug) |
| `PUT /api/arrangements/[id]` | `invalidateArrangement` |
| `DELETE /api/arrangements/[id]` | `invalidateArrangement` (slug read before the delete) |
| `PUT /api/arrangements/[id]/pieces` | `invalidateArrangement` |
| `POST /api/tags`, `PUT`/`DELETE /api/tags/[id]` | `invalidateTags` |
| `POST /api/pieces`, `PUT`/`DELETE /api/pieces/[id]` | `invalidatePieces` |
| `POST /api/resources`, `PUT`/`DELETE /api/resources/[id]` | `invalidateResources` |
| `POST /api/files` (both modes), `POST /api/files/youtube`, `DELETE /api/files/[id]` | `invalidateFileOwner` → `invalidateShow` and/or `invalidateArrangement` |

A new write route must call one of these. A new read that joins another entity
must add that entity's tag.

## The database client

`lib/database/index.ts` exports `db` as a Proxy that creates the `postgres`
pool (`max: 5`) on first property access. Importing it never connects and
never throws. The first query without `DATABASE_URL` throws
`DATABASE_URL is not set`. `getDb()` returns the real instance, and
`isDatabaseConfigured()` checks the env without connecting.
