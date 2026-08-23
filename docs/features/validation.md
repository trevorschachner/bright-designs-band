# Validation schemas

Zod schemas in `lib/validation/` guard every API write. There are two kinds, and
mixing them up is what caused the defect this doc exists to prevent.

## The rule

**Generate the schema when it is meant to mirror a table. Hand-write it when it
is a wire contract that differs from storage by design.**

### Generated — `lib/validation/shows.ts`

`showSchema` is built with `drizzle-zod` from the `shows` table and `.pick()`ed
down to the columns `POST /api/shows` inserts. Column types, the difficulty
enum, and nullability all come from Drizzle. A key naming a column that does not
exist **fails to compile**.

It was previously hand-written, and it had drifted: it declared seven columns
that do not exist (`quantity`, `instrumentation`, `composer`, `arranger`,
`lyricist`, `songTitle`, `bpm`) and omitted nine that do. Nothing broke only
because the route enumerates its insert columns explicitly instead of spreading
the parsed body — one `...spread` away from a live defect. The filter schema had
the identical problem and cost nine months of broken filters before anyone
noticed.

### Hand-written — `lib/validation/contact.ts`

`contactSubmissionSchema` models the **public form payload**, not the
`contact_submissions` table. The handler maps `name` onto `firstName`/`lastName`
and `showInterest` onto `service`. Generating this from the table would force
the wire format to match storage and break the mapping.

The same applies to any schema describing what a client sends rather than what a
row looks like.

## Two traps

**`numeric` columns are strings.** Drizzle carries `numeric` as a string to
avoid float precision loss, so a generated schema accepts only strings for
`price`. Callers send numbers, because the old hand-written schema declared
`z.number()`. `showSchema` accepts both and normalises to the string form. A
naive generation would have silently 400'd every request setting a price.

**`drizzle-zod` is pinned to 0.7.1.** Versions 0.8+ are built against zod v4;
this project uses the v3 API throughout. Mixing them puts two zod versions in
one file and breaks across the boundary — v4 renames `error.errors` to
`error.issues`, among other changes. Moving to `drizzle-zod` 0.8+ means
migrating the whole project to zod v4.

## Trimming

Title fields `.trim()` at the schema boundary. `shows.slug` is generated from
`title`, so a trailing space becomes a bad URL, and exact-match filters and
ordering treat `'Foo '` and `'Foo'` as different values. 31 of 73 arrangement
titles and 9 show titles carried stray whitespace before this was added;
`drizzle/migrations/2026-08-23_trim_title_whitespace.sql` cleaned the existing
rows.

## Create is narrow on purpose

`POST /api/shows` accepts the fields the new-show form sends. The credit columns
(`commissioned`, `programCoordinator`, `percussionArranger`, `soundDesigner`,
`windArranger`, `drillWriter`), plus `featured`, `graphicUrl` and `youtubeUrl`,
are settable only through `PUT /api/shows/[id]`.

Widening create would be inert until the form sends them, and a schema claiming
a capability the UI cannot exercise is the same kind of lie as a phantom column.
There are tests pinning both halves: the phantom fields are dropped, and the
edit-only fields are rejected at create.
