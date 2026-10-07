# lib/services: the read layer and cache invalidation

Every database read a page or API route makes goes through a function here.
Writes stay in the API routes, and each one ends by calling one helper from
`invalidate.ts`.

| File | What it reads |
| --- | --- |
| `shows.ts` | Featured shows, collections, the `/api/shows` page, show detail, a show's arrangements and files, slugs, the show index for `/llms.txt` |
| `arrangements.ts` | The `/api/arrangements` page, `/api/arrangements/[id]`, the `/arrangements/[id]` page and OG image (`getArrangementDetail`: one relational query) |
| `catalog.ts` | `queryShows` / `queryArrangements`: parse + bound the catalog query, then one paged read (below) |
| `pieces.ts` | Public source-piece credits; admin piece lists |
| `resources.ts` | Active resources; one resource by id or slug (`/api/resources/[id]`); admin list including drafts |
| `tags.ts` | All tags; one tag (`/api/tags/[id]`) |
| `sitemap.ts` | Show slugs and arrangement ids for `/sitemap.xml` (`app/sitemap.ts`) |
| `admin.ts` | Dashboard counts |
| `admin-users.ts` | The admin allowlist (`admin_users`) for `/admin/users`, uncached; `mutateAdminUsers()` locks the rows for the owner-protection rules |
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
   `cachedRead` returns `atBuildWithoutDb` without querying or caching, and
   warns once per key. The prerendered page is the empty state until the
   first revalidation or write. In a Netlify production build
   (`CONTEXT=production`) it throws `DATABASE_URL is required for a production
   build` instead: production never ships empty prerendered pages. Collection
   pages (`/collections/<slug>`) built this way hold no tagged read, so
   `invalidateShow` and `invalidateTags` name their paths.
6. **JSON-safe results.** A cache hit comes back through JSON, so services
   return ISO strings for timestamps (`toIso`) and plain objects, not Maps.
7. **Admin reads are uncached.** Functions named `...ForAdmin` call the query
   directly. Routes serve them only after `guard()` passes, with
   `Cache-Control: private, no-store` (`PrivateResponse` / `PRIVATE_HEADERS`).
   The admin UI asks for them with `?admin=true` (shows, tags) or `?all=true`
   (resources), so it sees its own writes. These routes are dynamic route
   handlers, so no `connection()` or `noStore()` call is needed.

## The catalog (`catalog.ts`)

`/shows`, `/arrangements`, `GET /api/shows` and `GET /api/arrangements` all
read one page through `queryShows(filters)` / `queryArrangements(filters)`.
These are not a second cache: they parse and bound the filters, then call
`getShowsPage` (`shows-page-v2`) or `getArrangementsPage`
(`arrangements-page-v3`), so there is one cache entry per (entity,
serialised filters).

- **Parsing** (`lib/filters/catalog-params.ts`, client-safe): a condition or
  sort naming a field outside `filter-definitions.ts`, or an operator that
  field does not offer, is dropped, not rejected. `limit` is capped at 48,
  `page` floored at 1, `search` trimmed, whitespace-collapsed and cut to 80
  characters. `queryShows` re-applies the bounds and a fixed key order, so a
  caller that skipped parsing cannot mint extra entries.
- **Searched reads are cached too, but for 300 s** (`SEARCH_REVALIDATE_SECONDS`)
  instead of 3600. Free text is the only input with a long tail of one-off
  values; a shorter life lets those entries age out. Same key and tags.
- **No price in the public contract.** `SHOWS_FILTER_FIELDS` (the public
  allowlist) has no `price`, so a public filter or sort on it is dropped, and
  `canonicalShowsParams` drops it even from unparsed input. The public read
  never selects the column (`ShowListItem` has no `price`). Only the admin
  read (`getShowsPageForAdmin`, `AdminShowListItem`,
  `SHOWS_ADMIN_FILTER_FIELDS`) carries it.
- **Admin is exempt.** `GET /api/shows?admin=true` from staff still calls the
  uncached `getShowsPageForAdmin` with the admin table's own page sizes (up to
  100).
- `queryShows` is wrapped in React `cache`, so the list and the sidebar's
  result count share one call per render. The detail pages do the same:
  `/shows/[slug]` and `/arrangements/[id]` wrap their lookup in React `cache`
  so `generateMetadata` and the page share it.

## CDN cache for the catalog pages

`/shows` and `/arrangements` read `searchParams`, so they are dynamic and Next
sends `Cache-Control: private, no-store`. `next.config.mjs` adds, for both
paths (`lib/catalog-cdn-headers.mjs`):

| Header | Value |
| --- | --- |
| `Netlify-CDN-Cache-Control` | `public, durable, s-maxage=3600, stale-while-revalidate=86400` |
| `Netlify-Cache-Tag` | `shows,arrangements,tags` |
| `Netlify-Vary` | `query,header=<Next's RSC request headers>,cookie=__prerender_bypass\|__next_preview_data` |

The browser keeps Next's private `Cache-Control`; only Netlify's CDN stores
the page. `query` (bare) caches every filter, page and limit variant
separately; without it `/shows?search=apex` would be served the cached
`/shows`. The `header=` part keeps HTML and RSC payloads apart.

How it interacts with `@netlify/plugin-nextjs` 5.16.2 (`dist/run/headers.js`):

- `setVaryHeaders` **merges** a response's own `Netlify-Vary` into its
  defaults (it does not overwrite it): bare `query` becomes "all query
  params", the `header=` and `cookie=` lists are appended to its own. We repeat
  its defaults anyway so the value is right on its own.
- `setCacheControlHeaders` leaves a response alone when it already carries
  `netlify-cdn-cache-control` and no `x-nextjs-cache` (true for a dynamic
  page), so our CDN header survives.
- `setCacheTagsHeaders` would overwrite `netlify-cache-tag` only when a full
  route cache entry was read; `unstable_cache` reads are data reads and never
  set it, so our tags survive.
- On `revalidateTag(tag)` the adapter also purges the CDN tag of the same
  name, so every helper in `invalidate.ts` that expires `shows`,
  `arrangements` or `tags` purges these pages.

**Trade-off.** A visitor may see a catalog page up to 1 h old (then up to a
day stale while it re-renders in the background) only if a purge is missed.
Normally a write purges within seconds. A write that touches none of the
three tags (pieces, resources) does not purge these pages; they do not show
piece credits or resources, so nothing visible goes stale. The free-text
search entries live 5 minutes in the data cache, but the CDN object for a
searched URL can live the full hour; tag purges still apply to it.

## Invalidation

`invalidate.ts` exports one helper per entity. Each one calls
`revalidateTag(tag, { expire: 0 })` for the entity tag and the list tag, then
`revalidatePath` for the detail page(s), `/`, the list page and
`/sitemap.xml`. `{ expire: 0 }` expires the entry immediately. The `'max'`
profile would serve the stale value once more, and the admin UI re-reads
straight after saving.

| Helper | Tags | Paths |
| --- | --- | --- |
| `invalidateShow(id, slug, previousSlug?)` | `show:<id>`, `shows` | `/shows/<slug>` (and the old slug), `/`, `/shows`, `/sitemap.xml`, `/llms.txt`, `/llms-full.txt`, every `/collections/<slug>` |
| `invalidateArrangement(id, showSlug?)` | `arrangement:<id>`, `arrangements` | `/arrangements/<id>`, `/shows/<showSlug>`, `/`, `/arrangements`, `/sitemap.xml` |
| `invalidateTags()` | `tags` | every `/shows/[slug]` and `/arrangements/[id]` page, `/`, `/shows`, `/arrangements`, `/sitemap.xml`, every `/collections/<slug>` |
| `invalidatePieces()` | `pieces` | same as tags |
| `invalidateResources()` | `resources` | `/resources`, `/`, `/sitemap.xml` |
| `invalidateCatalog()` | all five list tags | the whole site (`/`, layout), plus `/sitemap.xml`, `/llms.txt`, `/llms-full.txt` |

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
