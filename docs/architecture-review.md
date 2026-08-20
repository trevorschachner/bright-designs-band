# Architecture review

2026-08-20. Reviewed with the deep-module lens: a module is **deep** when a lot of
behaviour sits behind a small interface, **shallow** when the interface is nearly as
complex as what it hides. "Interface" here means everything a caller has to know to use
the module correctly, including error modes and ordering constraints, not just the type
signature.

Shape: 233 files, ~31k lines. `app/` 11.6k, `components/` 12.5k, `lib/` 6.9k.

The headline is that this codebase already contains the pattern worth spreading. It just
has not been spread.

---

## 1. `guard()` is the model. Point at it.

`lib/auth/guard.ts` is 57 lines and it is the best-designed module here.

The interface is two lines at every call site:

```ts
const gate = await guard('canManageShows')
if (gate.denied) return gate.denied
```

Behind that sit: the lazy Supabase import and its failure mode, the choice of `getUser()`
over `getSession()`, fail-closed error handling, the mapping to 401/403/500, and
permission resolution. A caller learns one function and one permission name and gets all
of it.

It also gets the test surface right. `resolveAuthorization()` in `lib/auth/authorization.ts`
is 23 lines, pure, and tested directly in `lib/auth/__tests__/authorization.test.ts`. That
is an **internal seam**: private to the implementation, used by its own tests, not part of
what callers see.

## 2. The migration to that seam is half-finished, and the unfinished half is the risky half

Seven of sixteen API routes call `guard()`. Six others hand-roll authorization in three
competing idioms:

| Idiom | Routes |
| --- | --- |
| `guard('canX')` | arrangements, arrangements/[id], resources, resources/[id], tags, tags/[id], shows/[id] |
| `getSession()` + `requirePermission()` | shows (POST), admin/shows/backfill-images |
| `getUser()` + `requirePermission()` | files (POST), files/sign |
| `getSession()` + `getUserPermissions()` + manual property check | files/[id] (DELETE), files/youtube |

Four routes still call `getSession()`. `guard.ts`'s own comment says why that matters:

> `getUser` revalidates against the auth server; `getSession` trusts the cookie. The routes
> were split between the two, so standardise on the safer one.

The standardisation happened for seven routes and stopped. `getSession()` is still what
gates file deletion, YouTube attachment, show creation, and the image backfill.

Apply the **deletion test**: delete those six hand-rolled blocks and no complexity
reappears, because it already lives in `guard()`. They are pass-throughs. Replacing them
is mechanical, and it makes one seam real instead of four adapters for one concern.

## 3. `lib/filters` is the shallow module

`QueryBuilder` presents five static methods, and that is the smaller half of its interface.
The undocumented half is what callers actually have to know:

- `buildWhereClause` **throws** `Column <field> not found in table` on any unknown field.
  Both routes let that escape into a catch-all 500.
- You must separate relation conditions out yourself before calling it.
- You must build the where clause twice, once for the count query and once for the rows.
- You must combine the conditions with `and()` yourself.
- You must supply the searchable-field list, and a wrong name is discarded silently rather
  than reported.

The result is 236 lines of orchestration across two callers, and they have diverged.
`app/api/arrangements/route.ts` filters `tags` conditions out and handles them with an
`exists` subquery. `app/api/shows/route.ts` passes every condition straight through, so
filtering shows by `tags` or `arrangements`, both of which `SHOWS_FILTER_FIELDS` offers in
the UI, throws. Arrangements reports that as a 500. Shows does not: its `GET` catch
returns an empty 200, so a broken filter came back as "no shows match" and was
indistinguishable from a genuine no-match.

Deleting `QueryBuilder` would move very little complexity into its callers, because the
complexity is already sitting in the callers. That is the definition of a pass-through.

**Direction:** one deep module with roughly this interface.

```ts
queryTable(table, filterState, {
  searchable: ['title', 'composer', 'arranger'],
  relations: { tags: tagsSubquery },
}): Promise<{ rows: T[]; total: number }>
```

That absorbs the double query, the `and()` composition, pagination, ordering, relation
handling, and a single decided policy for unknown fields (ignore them, or reject with 400,
but decided once rather than by accident in a `catch`). Both routes collapse to a handful
of lines, and the shows/arrangements divergence stops being possible.

## 4. `schema-analyzer` is a second source of truth for table shape

`SHOWS_SCHEMA` and `ARRANGEMENTS_SCHEMA` restate, by hand, what Drizzle already knows.
Restating drifted: `type`, `price` and `showId` sat in `ARRANGEMENTS_SCHEMA` for nine
months after the columns stopped existing, and the UI offered both broken filters the whole
time.

`lib/filters/__tests__/schema-analyzer.test.ts` now catches that drift. Deriving the fields
from `getTableColumns(table)` plus an explicit allowlist of what is filterable would make
the drift unrepresentable instead of merely detected. The allowlist is the part worth
hand-maintaining, because "which columns should users filter on" is a product decision.
"What columns exist" is not.

## 5. `lib/services/shows.ts` has the right caching shape and leaks its internal seam

The `fetchX` (raw) / `getX` (cached, build-guarded, error-tolerant) split is good layering.
Two things weaken the interface:

- `fetchFeaturedShows` is exported alongside `getFeaturedShows`. The internal seam is public,
  so callers can bypass the cache and the build guard without knowing they did.
- Both `getX` functions swallow errors and return `[]`. At the interface, a database
  failure is indistinguishable from "there are no featured shows". The homepage renders
  empty either way. If that is deliberate it belongs in the type (`Result<Show[], Error>`)
  or at minimum in a doc comment.

## 6. Smaller things

- **`lib/database/queries.ts` ends with ~90 lines of commented-out tutorial** showing usage
  of `getAllShows` and `getShowsWithFilters`. Neither function exists anywhere in `lib/`.
  Documentation describing an interface that was never built.
- **Two data-access modules with unclear division.** `lib/database/queries.ts` (528 lines,
  14 exported functions) and `lib/services/shows.ts` (261 lines) both read shows. Which one
  a new query belongs in is not answerable from the code.
- **`app/admin/shows/[id]/page.tsx` is 1466 lines**, three times the next-largest file.
  Not reviewed in depth here, but worth a locality pass.

---

## Suggested order

1. **Finish the `guard()` migration** (six routes). Smallest change, highest value, closes
   the `getSession()` gap, and needs no design work because the design already exists.
2. **Collapse `QueryBuilder` into one `queryTable` module.** Fixes the shows relation-filter
   500 as a side effect rather than as a separate patch.
3. **Derive filter fields from Drizzle.** Retires the parallel schema.
4. **Delete the dead tutorial block** and decide the `queries.ts` / `services/` split.
