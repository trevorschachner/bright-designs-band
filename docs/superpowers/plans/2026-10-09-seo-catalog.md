# SEO Catalog (A1–A3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make show pages and collection pages the pages Google and AI engines rank for "marching band shows …" searches: correct canonicals, intent-carrying titles, program notes with question-shaped sections and FAQ schema on every show, slugged and indexable-when-substantive arrangement pages, and 14 data-driven collection landing pages.

**Architecture:** Next.js 16 App Router on Netlify, Postgres (Supabase) through Drizzle, cached service reads tagged in `lib/cache-tags.ts` and expired in `lib/services/invalidate.ts`. Public pages build metadata through `lib/seo/metadata.ts` and JSON-LD through `lib/seo/structured-data.ts`. Collections are static config in `lib/collections.ts` filtered by `getShowsByFilter`. Content fields live on the `shows` and `arrangements` tables and are edited in `/admin` through Server Actions validated in `lib/validation/*.ts`.

**Tech Stack:** TypeScript, Next.js 16, React 19, Drizzle ORM + hand SQL migrations in `drizzle/migrations/YYYY-MM-DD_name.sql`, Zod, Vitest (`npm test`), ESLint (`npm run lint`), `npm run typecheck`, Lighthouse CI byte budget 425 KiB script.

**Spec:** `~/Library/Mobile Documents/com~apple~CloudDocs/Bright Designs Working Folder/_context/handoffs/seo-program.md` (sections 3.A1–A3, 4). Audit: `_context/topics/seo.md` in the same folder.

## Global Constraints

- Never render, emit or accept a price on a public page, in JSON-LD, in `llms*.txt` or in CSV exports (`offers` carries no `price`).
- Every public URL emits exactly one canonical: `https://brightdesigns.band` + its own path (apex, no `www.`, no trailing slash except the root which is the bare origin).
- Site URL comes from `getPublicSiteUrl()` (`lib/env.ts`); never hard-code the host in page files.
- Cached reads carry the tags of every entity they read (`lib/services/README.md`); every write route calls exactly one `invalidate*` helper.
- Lighthouse CI budget: 425 KiB script per page; no new client-side JS on public pages beyond what a task names.
- Migrations: hand SQL in `drizzle/migrations/<date>_<name>.sql`, idempotent (`IF NOT EXISTS`), applied with `npm run db:migrate` **before** the PR that needs them merges (see the SP3 checklist pattern in PR #68).
- Titles ≤ 60 characters where the show title allows; meta descriptions 120–155 characters; no keyword stuffing (the 50-state keyword list in `lib/seo/metadata.ts` `pageSEOConfigs.home` is removed in Task 2).
- Copy rules for anything rendered from this plan's own strings: plain, specific, no superlatives ("award-winning", "championship-caliber") unless the page cites the result.
- Commit after each task; branch `seo/catalog` off `main`; no Co-Authored-By or generated-with lines in commits.

## Review Focus

1. A show whose `programNotes` is null or empty must render the page exactly as today (no empty H2s, no FAQPage schema with empty answers). Test in Task 6.
2. A collection whose filter matches fewer than 2 shows must 404, be absent from `generateStaticParams`, the sitemap, `/collections` and `llms.txt`. Test in Task 9.
3. An arrangement with a short description (< 120 words) must emit `robots: noindex, follow`, be absent from the sitemap, but still render and be linked from its show page. Test in Task 8.
4. `/arrangements/<id>` (numeric) must 308 to `/arrangements/<slug>`; a slug that no longer exists must 404 (no redirect loop); two arrangements with the same title must get distinct slugs. Tests in Task 7.
5. Show page `duration` strings like `7:30`, `7:30 min`, `8 min`, `` (empty) must map to ISO 8601 (`PT7M30S`, `PT7M30S`, `PT8M`) or be omitted, never emit `PTNaNS`. Test in Task 5.

---

### Task 1: Self-canonical on every public page

**Files:**
- Modify: `lib/seo/metadata.ts` (add `path`, derive canonical)
- Modify: `app/layout.tsx:42-45` (remove root canonical)
- Modify: every static public page/layout that exports `metadata` or `generateMetadata`: `app/page.tsx`, `app/shows/layout.tsx`, `app/arrangements/layout.tsx`, `app/collections/page.tsx`, `app/collections/[slug]/page.tsx`, `app/services/page.tsx`, `app/about/layout.tsx`, `app/process/page.tsx`, `app/faqs/page.tsx`, `app/contact/layout.tsx`, `app/resources/page.tsx`, `app/blog/page.tsx`, `app/blog/how-to-choose-a-designer/page.tsx`, `app/blog/case-studies/page.tsx`, `app/blog/case-studies/[school]/page.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx`
- Test: `lib/seo/__tests__/canonical.test.ts`

**Interfaces:**
- Produces: `generateMetadata(config: Partial<SEOConfig> & { path?: string })` where `path` (e.g. `/faqs`) yields `alternates.canonical = getPublicSiteUrl() + path` (`/` → bare origin). Explicit `canonical` still wins when given. Later tasks pass `path` everywhere.

- [ ] **Step 1: Write the failing test**

```ts
// lib/seo/__tests__/canonical.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://brightdesigns.band')
})

describe('generateMetadata canonical', () => {
  it('derives the canonical from path on the apex origin', async () => {
    const { generateMetadata } = await import('@/lib/seo/metadata')
    expect(generateMetadata({ title: 't', description: 'd', path: '/faqs' }).alternates?.canonical).toBe('https://brightdesigns.band/faqs')
    expect(generateMetadata({ title: 't', description: 'd', path: '/' }).alternates?.canonical).toBe('https://brightdesigns.band')
  })

  it('leaves canonical undefined when neither path nor canonical is given', async () => {
    const { generateMetadata } = await import('@/lib/seo/metadata')
    expect(generateMetadata({ title: 't', description: 'd' }).alternates?.canonical).toBeUndefined()
  })
})

describe('static routes', () => {
  // Every public route that exports a static `metadata`. Dynamic routes are
  // covered by their own page tests (shows, arrangements, collections, blog).
  const routes: Array<[string, string]> = [
    ['../../../app/layout', ''], // root layout must NOT set one (it would leak into every page)
    ['../../../app/page', '/'],
    ['../../../app/shows/layout', '/shows'],
    ['../../../app/arrangements/layout', '/arrangements'],
    ['../../../app/collections/page', '/collections'],
    ['../../../app/services/page', '/services'],
    ['../../../app/about/layout', '/about'],
    ['../../../app/process/page', '/process'],
    ['../../../app/faqs/page', '/faqs'],
    ['../../../app/contact/layout', '/contact'],
    ['../../../app/resources/page', '/resources'],
    ['../../../app/blog/page', '/blog'],
    ['../../../app/blog/how-to-choose-a-designer/page', '/blog/how-to-choose-a-designer'],
    ['../../../app/blog/case-studies/page', '/blog/case-studies'],
    ['../../../app/privacy/page', '/privacy'],
    ['../../../app/terms/page', '/terms'],
  ]
  for (const [mod, path] of routes) {
    it(`${path || 'root layout'} canonical`, async () => {
      const m = await import(mod)
      const canonical = m.metadata?.alternates?.canonical
      if (path === '') expect(canonical).toBeUndefined()
      else expect(canonical).toBe(path === '/' ? 'https://brightdesigns.band' : `https://brightdesigns.band${path}`)
    })
  }
})
```

If a listed module throws on import in the test environment (a page that imports a DB client at module scope), mock that import the way `app/__tests__/llms.test.ts` mocks `@/lib/services/shows`; do not drop the route from the list.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/seo/__tests__/canonical.test.ts`
Expected: FAIL. `path` is not a known option (canonical undefined for `/faqs`), root layout has a canonical, most routes have none, blog routes have `www.`.

- [ ] **Step 3: Implement `path` in the helper and remove the root canonical**

In `lib/seo/metadata.ts`:

```ts
export interface SEOConfig {
  title: string
  description: string
  keywords?: readonly string[]
  ogImage?: string
  structuredData?: Record<string, unknown>
  canonical?: string
  /** Site-relative path of this page ('/faqs'). Builds the canonical on the public origin. */
  path?: string
  noindex?: boolean
}

export function canonicalFor(path: string): string {
  const origin = (getOptionalPublicSiteUrl() || 'https://brightdesigns.band').replace(/\/+$/, '')
  const clean = path === '/' ? '' : '/' + path.replace(/^\/+/, '').replace(/\/+$/, '')
  return origin + clean
}
```

and in `generateMetadata`:

```ts
const canonical = sanitizePublicUrl(config.canonical) ?? (config.path ? canonicalFor(config.path) : undefined)
...
alternates: canonical ? { canonical } : undefined,
```

In `app/layout.tsx` replace the metadata export with:

```ts
export const metadata: Metadata = generateMetadata({ ...defaultSEOConfig })
```

Then in each route listed in the test, add `path: '<route path>'` to its `buildMetadata`/`generateMetadata` call (or create one where the page has no metadata export: `export const metadata = buildMetadata({ title, description, path })` using the page's current title/description). In the two blog files and `app/blog/case-studies/[school]/page.tsx`, replace `canonical: \`https://www.brightdesigns.band${post.href}\`` with `path: post.href`, and the breadcrumb URLs `'https://www.brightdesigns.band'` with `'/'`, `'/blog'`, `post.href` (`createBreadcrumbSchema` makes them absolute).

- [ ] **Step 4: Run tests, typecheck, lint**

Run: `npx vitest run lib/seo && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/seo app/layout.tsx app/**/page.tsx app/**/layout.tsx
git commit -m "Self-canonical on every public page; drop the root canonical that leaked the homepage"
```

---

### Task 2: Intent-carrying titles and descriptions

**Files:**
- Modify: `lib/seo/metadata.ts` (`defaultSEOConfig`, delete `pageSEOConfigs` 50-state keywords block)
- Modify: `app/shows/layout.tsx`, `app/arrangements/layout.tsx`, `app/services/page.tsx`, `app/about/layout.tsx`, `app/page.tsx`
- Modify: `app/shows/[slug]/page.tsx:80-86` (show title template, description from program notes once Task 4 lands; for now description unchanged)
- Modify: `app/arrangements/[id]/page.tsx:53-58`
- Create: `lib/seo/titles.ts`
- Test: `lib/seo/__tests__/titles.test.ts`

**Interfaces:**
- Produces: `showTitle({ title, difficulty, year })`, `arrangementTitle({ title, composer })` in `lib/seo/titles.ts`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/seo/__tests__/titles.test.ts
import { describe, expect, it } from 'vitest'
import { showTitle, arrangementTitle } from '@/lib/seo/titles'

describe('showTitle', () => {
  it('carries difficulty and year', () => {
    expect(showTitle({ title: 'Ride the Wave', difficulty: 'Beginner', year: 2025 }))
      .toBe('Ride the Wave – Beginner Marching Band Show (2025) | Bright Designs')
  })
  it('omits missing parts', () => {
    expect(showTitle({ title: 'Apex', difficulty: null, year: null })).toBe('Apex – Marching Band Show | Bright Designs')
  })
  it('drops the brand when the title would pass 60 characters', () => {
    expect(showTitle({ title: 'Spices, Perfumes & Toxins', difficulty: 'Advanced', year: 2024 }))
      .toBe('Spices, Perfumes & Toxins – Advanced Marching Band Show (2024)')
  })
})

describe('arrangementTitle', () => {
  it('names the piece as a marching band arrangement', () => {
    expect(arrangementTitle({ title: 'Pipeline', composer: 'The Chantays' }))
      .toBe('Pipeline (The Chantays) – Marching Band Arrangement | Bright Designs')
    expect(arrangementTitle({ title: 'Pipeline', composer: null })).toBe('Pipeline – Marching Band Arrangement | Bright Designs')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/seo/__tests__/titles.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

```ts
// lib/seo/titles.ts
const BRAND = ' | Bright Designs'
const MAX = 60

function withBrand(core: string): string {
  return core.length + BRAND.length <= MAX ? core + BRAND : core
}

export function showTitle(s: { title: string; difficulty: string | null; year: number | null }): string {
  const level = s.difficulty ? `${s.difficulty} ` : ''
  const year = s.year ? ` (${s.year})` : ''
  return withBrand(`${s.title} – ${level}Marching Band Show${year}`)
}

export function arrangementTitle(a: { title: string; composer: string | null }): string {
  const by = a.composer?.trim() ? ` (${a.composer.trim()})` : ''
  return withBrand(`${a.title}${by} – Marching Band Arrangement`)
}
```

Static titles and descriptions (set them verbatim):

| File | title | description |
|---|---|---|
| `app/page.tsx` / `defaultSEOConfig` | `Marching Band Show Design: Custom Shows and Shows for Sale \| Bright Designs` | `Custom marching band shows, pre-written shows for sale, arrangements, drill and program coordination from a South Carolina design team. Music by May 1, drill by Labor Day.` |
| `app/shows/layout.tsx` | `Marching Band Shows for Sale – Full Catalog \| Bright Designs` | `Browse 30+ complete marching band shows by difficulty, band size and theme. Every show is available as-is, as individual arrangements, or as the start of a partial custom show.` |
| `app/arrangements/layout.tsx` | `Marching Band Arrangements of Popular Songs and Classics \| Bright Designs` | `Marching band arrangements of pop, rock, film and classical pieces, each with audio. Use one in your show or combine several into a build-your-own program.` |
| `app/services/page.tsx` | `Custom Marching Band Show Design, Drill and Arrangements \| Bright Designs` | `Custom music, drill, choreography and program coordination for competitive high school bands. Clear timelines, music by May 1, drill by Labor Day, quoted per program.` |
| `app/about/layout.tsx` | `Marching Band Show Designers in South Carolina \| Bright Designs` | `Bright Designs is Trevor Schachner, Brighton Barrineau and Ryan Wilhite: three designers writing custom and pre-written marching band shows for programs across the Southeast and beyond.` |

Show page: `title: showTitle({ title: showRow.title, difficulty: showRow.difficulty, year: showRow.year })`. Arrangement page: `title: arrangementTitle({ title: arr.title, composer: arr.composer })`. Delete `pageSEOConfigs` from `lib/seo/metadata.ts` and any import of it (grep `pageSEOConfigs`); trim `defaultSEOConfig.keywords` to the 6 phrases: `marching band shows`, `marching band show design`, `custom marching band show`, `marching band shows for sale`, `marching band arrangements`, `marching band drill design`.

- [ ] **Step 4: Run tests, typecheck, lint**

Run: `npx vitest run && npm run typecheck && npm run lint`
Expected: PASS (update any snapshot/expectation that asserted the old titles, e.g. in `app/shows/__tests__/`).

- [ ] **Step 5: Commit**

```bash
git add lib/seo app
git commit -m "Titles and descriptions that say what the page is: marching band shows, arrangements, design"
```

---

### Task 3: Program notes, ensemble size and includes on shows (schema, validation, admin, export)

**Files:**
- Create: `drizzle/migrations/2026-10-10_shows_program_notes.sql`
- Modify: `lib/database/schema.ts:14-42` (three columns)
- Modify: `lib/validation/shows.ts` (`UPDATABLE` + `CREATABLE`)
- Modify: `lib/services/shows.ts` (`SHOW_DETAIL_COLUMNS`, `ShowDetailRow`, `ShowIndexEntry`/`fetchShowIndex`, `SUMMARY_COLUMNS` untouched)
- Modify: `lib/services/admin.ts` (`getShowForEdit` returns the three fields)
- Modify: `components/features/admin/show-editor/ShowFields.tsx` and `ShowForm.tsx` (fields + `showFormToUpdate`)
- Modify: `lib/export/public-export.ts` and `lib/export/load-show-sheet.ts` (shows CSV: fill `ensemble_size`, `includes`; add `program_notes` column at the end)
- Test: `lib/validation/__tests__/shows.test.ts` (extend), `components/features/admin/show-editor/__tests__/ShowForm.test.tsx` (extend), `lib/export/__tests__/public-export.test.ts` (extend or create)

**Interfaces:**
- Produces on `shows`: `programNotes: text | null`, `ensembleSize: 'small' | 'medium' | 'large' | null` (reuses `ensembleSizeEnum`), `includes: text | null` (comma-separated subset of `SHOW_INCLUDES`).
- Produces: `export const SHOW_INCLUDES = ['winds', 'percussion', 'sound design', 'drill', 'choreography', 'props', 'graphic'] as const` in `lib/validation/enums.ts`.

- [ ] **Step 1: Migration**

```sql
-- drizzle/migrations/2026-10-10_shows_program_notes.sql
-- Program notes (long-form, markdown-lite: paragraphs and "- " bullets), the
-- band size a show suits, and what the package includes. Read by the public
-- show page, the admin editor, the CSV export and llms-full.txt.
ALTER TABLE shows ADD COLUMN IF NOT EXISTS program_notes text;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS ensemble_size ensemble_size;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS includes text;
```

- [ ] **Step 2: Write the failing validation test**

```ts
// append to lib/validation/__tests__/shows.test.ts
it('accepts programNotes, ensembleSize and includes on update', () => {
  const parsed = updateShowSchema.parse({
    id: 1, updatedAt: '2026-10-09T00:00:00.000Z', slug: 'apex',
    programNotes: 'A wolf-pack show.\n\n- Part 1: Hungry Like the Wolf',
    ensembleSize: 'medium',
    includes: 'winds, percussion, sound design',
  })
  expect(parsed.programNotes).toContain('wolf')
  expect(parsed.ensembleSize).toBe('medium')
  expect(parsed.includes).toBe('winds, percussion, sound design')
})

it('rejects an includes value outside the vocabulary', () => {
  expect(() => updateShowSchema.parse({ id: 1, updatedAt: '2026-10-09T00:00:00.000Z', slug: 'apex', includes: 'winds, kazoo' })).toThrow()
})
```

(Match the exact required keys of `updateShowSchema` from the existing tests in that file; `id`/`updatedAt` come from `concurrencyStamp`/`rowId`.)

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run lib/validation`
Expected: FAIL, unknown keys rejected.

- [ ] **Step 4: Implement schema, enum, validation**

`lib/validation/enums.ts`:

```ts
export const SHOW_INCLUDES = ['winds', 'percussion', 'sound design', 'drill', 'choreography', 'props', 'graphic'] as const
export type ShowInclude = (typeof SHOW_INCLUDES)[number]
```

`lib/database/schema.ts` (inside `shows`, after `duration`):

```ts
  // Long-form program notes shown on the public page (paragraphs + "- " bullets).
  programNotes: text('program_notes'),
  ensembleSize: ensembleSizeEnum('ensemble_size'),
  // Comma-separated subset of SHOW_INCLUDES (lib/validation/enums.ts).
  includes: text('includes'),
```

`lib/validation/shows.ts`: add `programNotes: true, ensembleSize: true, includes: true` to `UPDATABLE` and `programNotes: true` to `CREATABLE`; extend `updateShowSchema` with

```ts
    includes: z.string().trim().nullable().optional().refine(
      (v) => !v || v.split(',').map((s) => s.trim()).every((s) => (SHOW_INCLUDES as readonly string[]).includes(s)),
      'includes must be a comma-separated list from: ' + SHOW_INCLUDES.join(', ')
    ),
    ensembleSize: z.enum(ENSEMBLE_SIZES).or(z.literal('')).nullable().optional().transform((v) => (v === '' ? null : v ?? null)),
```

(the `''` form mirrors how `difficulty` handles the editor's empty select).

- [ ] **Step 5: Services, admin, export**

- `lib/services/shows.ts`: add the three columns to `SHOW_DETAIL_COLUMNS` and `ShowDetailRow`; add `programNotes` to `ShowIndexEntry` and `fetchShowIndex` (for `llms-full.txt`, Task 6).
- `lib/services/admin.ts` `getShowForEdit`: include the three fields in the returned `show`.
- `ShowFields.tsx`: add `<Field id="programNotes" label="Program notes">` with a `<Textarea rows={14}>` whose `placeholder` is the template below, a `<select>` for `ensembleSize` (`''`, small, medium, large), and a checkbox group for `includes` built from `SHOW_INCLUDES` that writes the comma-separated string into a hidden input. `showFormToUpdate` passes the three values through.
- Program-notes placeholder (verbatim):

```
One-sentence concept. Written for <school> (<year>); <difficulty>, about <runtime>.

The music
- Part 1 (opener): <pieces + composers>. <What it does dramatically.>
- Part 2 ...

Who it suits
<Winds size range, percussion and front-ensemble needs, guard load, staging or props.>

What you get
Winds, percussion, sound design files, show graphic, and <anything else>. Parts can be swapped: <one concrete swap idea>.
```

- Export: `load-show-sheet.ts` selects the three columns; `public-export.ts` shows CSV fills `ensemble_size` and `includes` from them and appends `program_notes` as the last column (the sheet's IMPORTDATA tabs are positional; appending keeps existing columns stable).

Extend `ShowForm.test.tsx` with one case: filling "Program notes" and saving calls `updateShow` with `programNotes` set. Extend/create `lib/export/__tests__/public-export.test.ts`: a show row with `programNotes: 'x'` appears in the last CSV column, quoted.

- [ ] **Step 6: Run everything**

Run: `npx vitest run && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add drizzle lib components
git commit -m "Shows gain program notes, ensemble size and includes: schema, admin editor, CSV export"
```

---

### Task 4: Program-notes renderer and ISO duration helper

**Files:**
- Create: `lib/content/program-notes.ts` (parser), `components/features/program-notes.tsx` (renderer)
- Create: `lib/seo/duration.ts`
- Test: `lib/content/__tests__/program-notes.test.ts`, `lib/seo/__tests__/duration.test.ts`

**Interfaces:**
- Produces: `parseProgramNotes(text: string | null | undefined): ProgramNotes` where `type ProgramNotes = { sections: { heading: string | null; blocks: ({ kind: 'p'; text: string } | { kind: 'ul'; items: string[] })[] }[]; wordCount: number; summary: string }`. A line that exactly matches a known heading (`The music`, `Who it suits`, `What you get`, or any line ≤ 40 chars with no terminal punctuation followed by a blank-free block) starts a section. `summary` = first paragraph (≤ 300 chars, cut at a sentence end).
- Produces: `isoDuration(input: string | null | undefined): string | null` → `'7:30' → 'PT7M30S'`, `'8 min' → 'PT8M'`, `'7:30 min' → 'PT7M30S'`, `'' → null`, `'abc' → null`.
- Produces: `<ProgramNotes notes={ProgramNotes} />` rendering `<h3>` per section heading (the page supplies the H2s), `<p>` and `<ul>`; no markdown library (keeps the JS budget).

- [ ] **Step 1: Write the failing tests**

```ts
// lib/seo/__tests__/duration.test.ts
import { describe, expect, it } from 'vitest'
import { isoDuration } from '@/lib/seo/duration'
describe('isoDuration', () => {
  it.each([
    ['7:30', 'PT7M30S'], ['7:30 min', 'PT7M30S'], ['8 min', 'PT8M'], ['8', 'PT8M'], ['5:48', 'PT5M48S'],
    ['', null], [null, null], [undefined, null], ['abc', null], ['7:xx', null],
  ])('%s → %s', (input, expected) => { expect(isoDuration(input as string | null | undefined)).toBe(expected) })
})
```

```ts
// lib/content/__tests__/program-notes.test.ts
import { describe, expect, it } from 'vitest'
import { parseProgramNotes } from '@/lib/content/program-notes'

const NOTES = `A wolf-pack show written for Ola High School (2025); Intermediate, about 7:30.

The music
- Part 1 (opener): Hungry Like the Wolf (Duran Duran). Sets the pack running.
- Part 2 (ballad): Wolf Totem (The HU). The pack at rest.

Who it suits
Bands of 40 to 90 winds with a full battery and front ensemble.

What you get
Winds, percussion, sound design files and the show graphic.`

describe('parseProgramNotes', () => {
  it('splits into sections with paragraphs and bullets', () => {
    const notes = parseProgramNotes(NOTES)
    expect(notes.sections.map((s) => s.heading)).toEqual([null, 'The music', 'Who it suits', 'What you get'])
    expect(notes.sections[1].blocks[0]).toEqual({ kind: 'ul', items: ['Part 1 (opener): Hungry Like the Wolf (Duran Duran). Sets the pack running.', 'Part 2 (ballad): Wolf Totem (The HU). The pack at rest.'] })
    expect(notes.sections[2].blocks[0]).toEqual({ kind: 'p', text: 'Bands of 40 to 90 winds with a full battery and front ensemble.' })
  })
  it('counts words and takes the first paragraph as summary', () => {
    const notes = parseProgramNotes(NOTES)
    expect(notes.wordCount).toBeGreaterThan(40)
    expect(notes.summary).toBe('A wolf-pack show written for Ola High School (2025); Intermediate, about 7:30.')
  })
  it('returns an empty structure for null', () => {
    expect(parseProgramNotes(null)).toEqual({ sections: [], wordCount: 0, summary: '' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/seo/__tests__/duration.test.ts lib/content/__tests__/program-notes.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

```ts
// lib/seo/duration.ts
/** "7:30", "7:30 min", "8 min", "8" → ISO 8601 duration; anything else → null. */
export function isoDuration(input: string | null | undefined): string | null {
  const m = (input ?? '').trim().match(/^(\d{1,3})(?::([0-5]\d))?\s*(?:min(?:utes)?)?$/i)
  if (!m) return null
  const minutes = Number(m[1])
  const seconds = m[2] ? Number(m[2]) : 0
  return `PT${minutes}M${seconds ? `${seconds}S` : ''}`
}
```

```ts
// lib/content/program-notes.ts
export type NoteBlock = { kind: 'p'; text: string } | { kind: 'ul'; items: string[] }
export type NoteSection = { heading: string | null; blocks: NoteBlock[] }
export type ProgramNotes = { sections: NoteSection[]; wordCount: number; summary: string }

const EMPTY: ProgramNotes = { sections: [], wordCount: 0, summary: '' }

/** A short line with no terminal punctuation, on its own, is a heading. */
function isHeading(line: string, next: string | undefined): boolean {
  return line.length <= 40 && !/[.!?:]$/.test(line) && !line.startsWith('- ') && next !== undefined && next.trim() !== ''
}

export function parseProgramNotes(text: string | null | undefined): ProgramNotes {
  const raw = (text ?? '').replace(/\r\n/g, '\n').trim()
  if (!raw) return EMPTY
  const lines = raw.split('\n').map((l) => l.trimEnd())
  const sections: NoteSection[] = [{ heading: null, blocks: [] }]
  let para: string[] = []
  let list: string[] = []
  const flush = () => {
    const current = sections[sections.length - 1]
    if (para.length) current.blocks.push({ kind: 'p', text: para.join(' ').trim() })
    if (list.length) current.blocks.push({ kind: 'ul', items: list })
    para = []; list = []
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) { flush(); continue }
    if (line.startsWith('- ')) { if (para.length) flush(); list.push(line.slice(2).trim()); continue }
    if (list.length) flush()
    if (para.length === 0 && isHeading(line, lines[i + 1]) && (i === 0 ? false : lines[i - 1].trim() === '')) {
      sections.push({ heading: line, blocks: [] }); continue
    }
    para.push(line)
  }
  flush()
  const kept = sections.filter((s) => s.heading !== null || s.blocks.length > 0)
  const words = raw.split(/\s+/).filter(Boolean).length
  const first = kept[0]?.blocks.find((b) => b.kind === 'p')
  const summary = first && first.kind === 'p' ? (first.text.length > 300 ? first.text.slice(0, 300).replace(/\s+\S*$/, '') : first.text) : ''
  return { sections: kept, wordCount: words, summary }
}
```

Note the first-line heading rule: the first line of the notes is always the concept sentence, never a heading (the `i === 0 ? false` guard); a heading must follow a blank line.

```tsx
// components/features/program-notes.tsx
import type { ProgramNotes as Notes } from '@/lib/content/program-notes'

export function ProgramNotes({ notes, className }: { notes: Notes; className?: string }) {
  if (notes.sections.length === 0) return null
  return (
    <div className={className}>
      {notes.sections.map((section, i) => (
        <div key={i} className="mb-6">
          {section.heading && <h3 className="text-xl font-heading font-semibold text-foreground mb-2">{section.heading}</h3>}
          {section.blocks.map((block, j) =>
            block.kind === 'p' ? (
              <p key={j} className="text-muted-foreground leading-relaxed mb-3">{block.text}</p>
            ) : (
              <ul key={j} className="list-disc pl-6 text-muted-foreground space-y-1 mb-3">
                {block.items.map((item, k) => <li key={k}>{item}</li>)}
              </ul>
            )
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run lib/seo lib/content`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/seo/duration.ts lib/content/program-notes.ts components/features/program-notes.tsx lib/seo/__tests__ lib/content/__tests__
git commit -m "Program-notes parser/renderer and ISO duration helper"
```

---

### Task 5: Richer show structured data (duration, level, offers, FAQ)

**Files:**
- Modify: `lib/seo/structured-data.ts:199-234` (`createMusicCompositionSchema` gains `duration`, `educationalLevel`, `offers`)
- Create: `lib/seo/show-faq.ts` (`showFaqs(show, notes, parts)` → `Faq[]`)
- Test: `lib/seo/__tests__/structured-data.test.ts` (extend), `lib/seo/__tests__/show-faq.test.ts`

**Interfaces:**
- Consumes: `isoDuration` (Task 4), `ProgramNotes` (Task 4), `Faq` from `lib/content/faqs.ts`.
- Produces: `createMusicCompositionSchema({ ..., duration?: string | null, educationalLevel?: string | null, inStock?: boolean })`; `showFaqs({ title, difficulty, duration, ensembleSize, year, commissioned }, notes: ProgramNotes, parts: { title: string; scene: string | null; pieces: string[] }[]): Faq[]` returning 0–3 FAQs, each only when its answer is non-empty.

- [ ] **Step 1: Write the failing tests**

```ts
// append to lib/seo/__tests__/structured-data.test.ts
describe('createMusicCompositionSchema (show fields)', () => {
  it('adds ISO duration, level and a price-less offer', () => {
    const s = createMusicCompositionSchema({ name: 'Apex', url: '/shows/apex', duration: 'PT7M30S', educationalLevel: 'Intermediate', inStock: true }) as any
    expect(s.duration).toBe('PT7M30S')
    expect(s.educationalLevel).toBe('Intermediate')
    expect(s.offers).toEqual({ '@type': 'Offer', availability: 'https://schema.org/InStock', url: 'https://brightdesigns.band/shows/apex', seller: expect.objectContaining({ '@type': 'Organization' }) })
    expect(JSON.stringify(s)).not.toMatch(/price/i)
  })
  it('omits duration and level when null', () => {
    const s = createMusicCompositionSchema({ name: 'Apex', url: '/shows/apex', duration: null, educationalLevel: null }) as any
    expect(s).not.toHaveProperty('duration')
    expect(s).not.toHaveProperty('educationalLevel')
    expect(s).not.toHaveProperty('offers')
  })
})
```

```ts
// lib/seo/__tests__/show-faq.test.ts
import { describe, expect, it } from 'vitest'
import { showFaqs } from '@/lib/seo/show-faq'
import { parseProgramNotes } from '@/lib/content/program-notes'

const notes = parseProgramNotes(`A wolf-pack show for Ola High School (2025).\n\nWho it suits\nBands of 40 to 90 winds.\n\nWhat you get\nWinds, percussion and sound design.`)
const parts = [
  { title: 'Hungry Like the Wolf', scene: 'Opener', pieces: ['Hungry Like the Wolf (Duran Duran)'] },
  { title: 'Wolf Totem', scene: 'Ballad', pieces: ['Wolf Totem (The HU)'] },
]

describe('showFaqs', () => {
  it('answers what, which music, and who for', () => {
    const faqs = showFaqs({ title: 'Apex', difficulty: 'Intermediate', duration: '7:30', ensembleSize: 'medium', year: 2025, commissioned: 'Ola High School' }, notes, parts)
    expect(faqs.map((f) => f.question)).toEqual(['What is Apex about?', 'What music is in Apex?', 'Who is Apex for?'])
    expect(faqs[1].answer).toContain('Hungry Like the Wolf (Duran Duran)')
    expect(faqs[2].answer).toContain('40 to 90 winds')
  })
  it('returns nothing without notes or parts', () => {
    expect(showFaqs({ title: 'X', difficulty: null, duration: null, ensembleSize: null, year: null, commissioned: null }, parseProgramNotes(null), [])).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/seo`
Expected: FAIL.

- [ ] **Step 3: Implement**

In `createMusicCompositionSchema` add parameters `duration?: string | null`, `educationalLevel?: string | null`, `inStock?: boolean` and spread:

```ts
    ...(duration ? { duration } : {}),
    ...(educationalLevel ? { educationalLevel } : {}),
    ...(inStock ? { offers: { '@type': 'Offer', availability: 'https://schema.org/InStock', url: absoluteUrl(url), seller: organizationRef() } } : {}),
```

```ts
// lib/seo/show-faq.ts
import type { Faq } from '@/lib/content/faqs'
import type { ProgramNotes } from '@/lib/content/program-notes'

type ShowFacts = { title: string; difficulty: string | null; duration: string | null; ensembleSize: string | null; year: number | null; commissioned: string | null }
type Part = { title: string; scene: string | null; pieces: string[] }

const sectionText = (notes: ProgramNotes, heading: string) =>
  notes.sections.find((s) => s.heading?.toLowerCase() === heading)?.blocks
    .map((b) => (b.kind === 'p' ? b.text : b.items.join('; ')))
    .join(' ') ?? ''

const SIZE = { small: 'small bands', medium: 'medium-sized bands', large: 'large bands' } as const

export function showFaqs(show: ShowFacts, notes: ProgramNotes, parts: Part[]): Faq[] {
  const faqs: Faq[] = []
  if (notes.summary) faqs.push({ question: `What is ${show.title} about?`, answer: notes.summary })
  const music = parts.map((p, i) => `${p.scene ?? `Part ${i + 1}`}: ${p.pieces.length ? p.pieces.join(', ') : p.title}`).join('. ')
  if (music) faqs.push({ question: `What music is in ${show.title}?`, answer: `${music}.` })
  const suits = sectionText(notes, 'who it suits')
  const facts = [show.difficulty ? `${show.difficulty} difficulty` : null, show.ensembleSize ? `written for ${SIZE[show.ensembleSize as keyof typeof SIZE] ?? show.ensembleSize}` : null, show.duration ? `about ${show.duration} long` : null].filter(Boolean).join(', ')
  if (suits || facts) faqs.push({ question: `Who is ${show.title} for?`, answer: [facts ? `${facts}.` : '', suits].filter(Boolean).join(' ') })
  return faqs
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run lib/seo`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/seo
git commit -m "Show schema: duration, level, in-stock offer without price; per-show FAQ builder"
```

---

### Task 6: Show page sections, FAQ schema, related links, llms-full notes

**Files:**
- Modify: `app/shows/[slug]/page.tsx` (sections, schemas, description from notes)
- Modify: `lib/services/shows.ts` (new `getRelatedShows`)
- Modify: `lib/seo/llms.ts` (`buildLlmsFullTxt` prints program notes after the description)
- Test: `app/shows/__tests__/show-page-sections.test.tsx` (new), `app/__tests__/llms.test.ts` (extend), `lib/services/__tests__/related-shows.test.ts` (new, mocking `db` the way `lib/services/__tests__/*.test.ts` already do)

**Interfaces:**
- Consumes: Tasks 3–5.
- Produces: `getRelatedShows(showId: number, difficulty: ShowDifficulty | null, tagNames: string[]): Promise<ShowSummary[]>` (max 3; same `Theme:` tag first, then same difficulty, newest first; cached `related-shows-v1`, tags `shows`,`tags`).

- [ ] **Step 1: Write the failing page test**

```tsx
// app/shows/__tests__/show-page-sections.test.tsx
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

const SHOW = {
  show: { id: 1, slug: 'apex', title: 'Apex', description: 'Card blurb.', year: 2025, difficulty: 'Intermediate', duration: '7:30', programNotes: 'A wolf-pack show for Ola High School (2025).\n\nWho it suits\nBands of 40 to 90 winds.', ensembleSize: 'medium', includes: 'winds, percussion', commissioned: 'Ola High School', youtubeUrl: null, graphicUrl: null, thumbnailUrl: null, createdAt: '2026-01-01T00:00:00.000Z' },
  showsToTags: [{ tag: { id: 1, name: 'Theme: Nature' } }],
}

vi.mock('@/lib/services/shows', () => ({
  getShowBySlug: vi.fn(async () => SHOW),
  getShowArrangements: vi.fn(async () => [{ id: 10, title: 'Hungry Like the Wolf', scene: 'Opener', audioUrl: null, slug: 'hungry-like-the-wolf' }]),
  getPublicShowFiles: vi.fn(async () => []),
  getAllShowSlugs: vi.fn(async () => ['apex']),
  getSlugRedirect: vi.fn(async () => null),
  getRelatedShows: vi.fn(async () => []),
}))
vi.mock('@/lib/services/pieces', () => ({ getPublicPiecesByArrangementIds: vi.fn(async () => ({ 10: [{ title: 'Hungry Like the Wolf', composer: 'Duran Duran' }] })) }))

beforeEach(() => vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://brightdesigns.band'))

describe('show page with program notes', () => {
  it('renders the question headings, the notes and a FAQPage schema', async () => {
    const { default: Page } = await import('../[slug]/page')
    const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ slug: 'apex' }) }))
    expect(html).toContain('What is Apex about?')
    expect(html).toContain('What music is in Apex?')
    expect(html).toContain('Who is Apex for?')
    expect(html).toContain('Bands of 40 to 90 winds.')
    expect(html).toContain('"@type":"FAQPage"')
    expect(html).toContain('"duration":"PT7M30S"')
    expect(html).toContain('/collections/grade-3-marching-band-shows')
  })
  it('renders no question headings or FAQPage when notes are empty', async () => {
    SHOW.show.programNotes = ''
    const { default: Page } = await import('../[slug]/page')
    const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ slug: 'apex' }) }))
    expect(html).not.toContain('What is Apex about?')
    expect(html).not.toContain('"@type":"FAQPage"')
  })
})
```

(If `app/shows/__tests__/shows-list.test.tsx` already establishes how to render an async server component in this repo, copy its approach; async components need `await Page(props)` then render the returned element.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/shows/__tests__/show-page-sections.test.tsx`
Expected: FAIL (no headings, no FAQPage, `getRelatedShows` missing).

- [ ] **Step 3: Implement the service**

In `lib/services/shows.ts`:

```ts
async function fetchRelatedShows(showId: number, difficulty: ShowDifficulty | null, tagNames: string[]): Promise<ShowSummary[]> {
  const themes = tagNames.filter((t) => t.startsWith('Theme: '))
  const rows = await db.query.shows.findMany({
    columns: SUMMARY_COLUMNS,
    where: ne(shows.id, showId),
    orderBy: [desc(shows.createdAt)],
    limit: 40,
    with: summaryRelations(),
  })
  const summaries = (rows as SummaryRow[]).map(toSummary)
  const sameTheme = summaries.filter((s) => s.showsToTags.some((r) => themes.includes(r.tag.name)))
  const sameLevel = summaries.filter((s) => s.difficulty === difficulty && !sameTheme.includes(s))
  return [...sameTheme, ...sameLevel].slice(0, 3)
}

/** Up to 3 shows to link from a show page: same theme tag first, then same difficulty. */
export const getRelatedShows = cachedRead('related-shows-v1', fetchRelatedShows, {
  tags: () => [TAGS.shows, TAGS.tags],
  atBuildWithoutDb: [] as ShowSummary[],
});
```

- [ ] **Step 4: Implement the page**

In `app/shows/[slug]/page.tsx`:

1. Import `parseProgramNotes`, `ProgramNotes`, `isoDuration`, `showFaqs`, `createFAQSchema`, `getRelatedShows`, `collectionsForShow` (Task 9 adds it; until then compute links from `collections` with the Task 9 helper's signature so Task 9 only swaps the import) and `ShowCard`.
2. `const notes = parseProgramNotes(showRow.programNotes)`.
3. `generateMetadata`: `description: notes.summary || showRow.description || 'Marching band show from Bright Designs.'`, trimmed to 155 chars at a word boundary.
4. Build `parts` for the FAQ: `arrangements.map((a) => ({ title: a.title ?? '', scene: a.scene, pieces: (piecesByArrangement[a.id] ?? []).map((p) => p.composer ? `${p.title} (${p.composer})` : p.title) }))`.
5. `const faqs = showFaqs({ title, difficulty: displayDifficulty || null, duration: show.duration, ensembleSize: showRow.ensembleSize, year: show.year, commissioned: showRow.commissioned }, notes, parts)`; push `createFAQSchema(faqs)` into `schemas` only when `faqs.length > 0`.
6. `createMusicCompositionSchema({ ..., duration: isoDuration(show.duration), educationalLevel: displayDifficulty || null, inStock: true, description: notes.summary || show.description })`.
7. Sections, after the header grid and before "What's Included", rendered only when `notes.sections.length > 0`:

```tsx
<section aria-labelledby="about-heading" className="mb-10 max-w-3xl">
  <h2 id="about-heading" className="text-2xl font-heading font-bold text-foreground mb-4">What is {show.title} about?</h2>
  <ProgramNotes notes={{ ...notes, sections: notes.sections.filter((s) => s.heading === null) }} />
</section>
<section aria-labelledby="music-heading" className="mb-10">
  <h2 id="music-heading" className="text-2xl font-heading font-bold text-foreground mb-4">What music is in {show.title}?</h2>
  <table className="w-full text-sm"> {/* one row per arrangement: Part n · scene · title · pieces (composer) · duration */} </table>
  <ProgramNotes notes={{ ...notes, sections: notes.sections.filter((s) => s.heading?.toLowerCase() === 'the music') }} />
</section>
<section aria-labelledby="for-heading" className="mb-10 max-w-3xl">
  <h2 id="for-heading" className="text-2xl font-heading font-bold text-foreground mb-4">Who is {show.title} for?</h2>
  <p className="text-muted-foreground mb-3">{/* difficulty · ensemble size (small/medium/large → "small bands" etc.) · duration · commissioned school + year */}</p>
  <ProgramNotes notes={{ ...notes, sections: notes.sections.filter((s) => s.heading?.toLowerCase() === 'who it suits') }} />
</section>
<section aria-labelledby="get-heading" className="mb-10 max-w-3xl">
  <h2 id="get-heading" className="text-2xl font-heading font-bold text-foreground mb-4">What's included with {show.title}?</h2>
  {/* chips from showRow.includes split on ',' */}
  <ProgramNotes notes={{ ...notes, sections: notes.sections.filter((s) => s.heading?.toLowerCase() === 'what you get') }} />
</section>
```

   Keep the existing `WhatIsIncluded` card (generic package contents) but render it under an H2 "What every package includes" so the two don't compete.
8. Collections and related shows, after the arrangements list:

```tsx
<section aria-labelledby="more-heading" className="mt-12">
  <h2 id="more-heading" className="text-2xl font-heading font-bold text-foreground mb-4">More shows like {show.title}</h2>
  <p className="text-muted-foreground mb-4">Browse {collectionLinks.map((c, i) => <span key={c.slug}>{i > 0 && ', '}<Link className="underline" href={`/collections/${c.slug}`}>{c.h1.toLowerCase()}</Link></span>)}.</p>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{related.map((s) => <ShowCard key={s.id} item={s} />)}</div>
</section>
```

   where `collectionLinks` = published collections whose filter this show satisfies (Task 9's `collectionsForShow(show)`; until Task 9 lands, an inline filter on `difficulty`/tag against `collections`), and `related = await getRelatedShows(showId, difficulty, tagNames)`.
9. Arrangement links in the parts list use `arrangement.slug` once Task 7 lands (Task 7 edits this line; leave `/arrangements/${arrangement.id}` here).

`lib/seo/llms.ts` `buildLlmsFullTxt`: after the description line, if `show.programNotes` is non-empty, append a blank line and `clean(show.programNotes)` (newlines collapsed to spaces is acceptable). Extend `app/__tests__/llms.test.ts` SHOWS with `programNotes: 'Deep notes here.'` on one show and assert `llms-full` contains it and `llms.txt` does not.

- [ ] **Step 5: Run tests, typecheck, lint, build**

Run: `npx vitest run && npm run typecheck && npm run lint && npm run build`
Expected: PASS; build green.

- [ ] **Step 6: Commit**

```bash
git add app/shows lib/services/shows.ts lib/seo/llms.ts app/__tests__/llms.test.ts lib/services/__tests__
git commit -m "Show page: question-shaped sections from program notes, FAQ schema, related shows and collections"
```

---

### Task 7: Arrangement slugs with 308 from numeric ids

**Files:**
- Create: `drizzle/migrations/2026-10-10_arrangements_slug.sql`
- Modify: `lib/database/schema.ts:45-69` (`slug`), `lib/validation/arrangements.ts` (slug optional on update, same regex as shows), `lib/actions/arrangements.ts` (create derives slug via `slugFromTitle` + collision suffix `-2`, `-3`)
- Modify: `lib/services/arrangements.ts` (`fetchArrangementDetail` by slug; `getArrangementBySlug`; list items carry `slug`), `lib/services/shows.ts` (`fetchShowArrangements` selects `slug`), `lib/services/sitemap.ts` (`arrangements: { slug, indexable }` instead of ids; Task 8 sets `indexable`)
- Modify: `lib/cache-tags.ts` (`PATHS.arrangement(slug)`), `lib/services/invalidate.ts` (`invalidateArrangement(id, slug, showSlug, previousSlug?)`)
- Rename: `app/arrangements/[id]` → `app/arrangements/[slug]` (page + opengraph-image); page resolves numeric → `permanentRedirect('/arrangements/<slug>')`
- Modify: every `href={\`/arrangements/${...id}\`}` (grep `'/arrangements/'` and `` `/arrangements/${ `` across `app/` and `components/`) to use `slug`
- Modify: `app/sitemap.ts`, `app/__tests__/robots-sitemap.test.ts`
- Test: `app/arrangements/__tests__/slug-route.test.ts` (new), `lib/actions/__tests__/arrangements-slug.test.ts` (new, or extend the existing actions test file)

**Interfaces:**
- Produces: `arrangements.slug: text NOT NULL UNIQUE`; `getArrangementBySlug(slug: string): Promise<ArrangementDetail | null>`; `ArrangementDetail.slug`, `ShowArrangement.slug`, `ArrangementListItem.slug`; `PATHS.arrangement(slug: string)`.

- [ ] **Step 1: Migration with backfill**

```sql
-- drizzle/migrations/2026-10-10_arrangements_slug.sql
-- Public URL slug for arrangements (/arrangements/<slug>); numeric ids 308 to it.
ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS slug text;

-- Backfill: lowercase title, non-alphanumerics to hyphens, collapsed; duplicates get -<id>.
WITH base AS (
  SELECT id, trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')) AS s FROM arrangements WHERE slug IS NULL
), ranked AS (
  SELECT id, s, row_number() OVER (PARTITION BY s ORDER BY id) AS n FROM base
)
UPDATE arrangements a SET slug = CASE WHEN r.n = 1 AND NOT EXISTS (SELECT 1 FROM arrangements x WHERE x.slug = r.s) THEN r.s ELSE r.s || '-' || a.id END
FROM ranked r WHERE a.id = r.id;

UPDATE arrangements SET slug = 'arrangement-' || id WHERE slug IS NULL OR slug = '';
ALTER TABLE arrangements ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS arrangements_slug_unique_idx ON arrangements (slug);
```

- [ ] **Step 2: Write the failing route test**

```ts
// app/arrangements/__tests__/slug-route.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const redirect = vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`) })
vi.mock('next/navigation', () => ({ permanentRedirect: redirect, notFound: () => { throw new Error('NOT_FOUND') } }))
vi.mock('@/lib/services/arrangements', () => ({
  getArrangementBySlug: vi.fn(async (slug: string) => (slug === 'pipeline' ? { id: 2, slug: 'pipeline', title: 'Pipeline', composer: 'The Chantays', description: null, files: [], pieces: [], show: null, grade: null, ensembleSize: null, durationSeconds: null, year: null, arranger: null, percussionArranger: null, scene: null, youtubeUrl: null, sampleScoreUrl: null } : null)),
  getArrangementSlugById: vi.fn(async (id: number) => (id === 2 ? 'pipeline' : null)),
}))

beforeEach(() => vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://brightdesigns.band'))

describe('/arrangements/[slug]', () => {
  it('308s a numeric id to its slug', async () => {
    const { default: Page } = await import('../[slug]/page')
    await expect(Page({ params: Promise.resolve({ slug: '2' }) })).rejects.toThrow('REDIRECT:/arrangements/pipeline')
  })
  it('404s an unknown numeric id without redirecting', async () => {
    const { default: Page } = await import('../[slug]/page')
    await expect(Page({ params: Promise.resolve({ slug: '999' }) })).rejects.toThrow('NOT_FOUND')
  })
  it('404s an unknown slug', async () => {
    const { default: Page } = await import('../[slug]/page')
    await expect(Page({ params: Promise.resolve({ slug: 'nope' }) })).rejects.toThrow('NOT_FOUND')
  })
  it('canonicalises to the slug URL', async () => {
    const { generateMetadata } = await import('../[slug]/page')
    const m = await generateMetadata({ params: Promise.resolve({ slug: 'pipeline' }) })
    expect(m.alternates?.canonical).toBe('https://brightdesigns.band/arrangements/pipeline')
  })
})
```

And the slug-derivation test for the create action:

```ts
// lib/actions/__tests__/arrangements-slug.test.ts
import { describe, expect, it } from 'vitest'
import { uniqueArrangementSlug } from '@/lib/actions/arrangements'
describe('uniqueArrangementSlug', () => {
  it('derives from the title and suffixes on collision', async () => {
    const taken = new Set(['pipeline', 'pipeline-2'])
    expect(await uniqueArrangementSlug('Pipeline', async (s) => taken.has(s))).toBe('pipeline-3')
    expect(await uniqueArrangementSlug('Girls on the Beach!', async () => false)).toBe('girls-on-the-beach')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run app/arrangements lib/actions`
Expected: FAIL.

- [ ] **Step 4: Implement**

- Schema: `slug: text('slug').notNull().unique(),` on `arrangements`.
- `lib/actions/arrangements.ts`: export

```ts
export async function uniqueArrangementSlug(title: string, exists: (slug: string) => Promise<boolean>): Promise<string> {
  const base = slugFromTitle(title) || 'arrangement'
  let candidate = base
  for (let n = 2; await exists(candidate); n++) candidate = `${base}-${n}`
  return candidate
}
```

  and call it in the create action (`exists` = `db.select({ id }).from(arrangements).where(eq(arrangements.slug, s)).limit(1)` non-empty). Update accepts an explicit `slug` (same regex as shows) and, when it changes, passes `previousSlug` to `invalidateArrangement`.
- Services: `fetchArrangementDetail(slug: string)` looks up by `arrangements.slug`; add `export async function getArrangementSlugById(id: number)`; select `slug` in `fetchShowArrangements`, `fetchArrangementsPage`, `fetchArrangementForApi`.
- Page `app/arrangements/[slug]/page.tsx`:

```ts
const { slug } = await params
if (/^\d+$/.test(slug)) {
  const real = await getArrangementSlugById(Number(slug))
  if (real) permanentRedirect(`/arrangements/${real}`)
  notFound()
}
const arr = await getArrangement(slug)
if (!arr) notFound()
```

  with `generateMetadata` using `path: \`/arrangements/${arr.slug}\`` and `arrangementTitle` (Task 2). The `generateStaticParams` stays `[]`.
- `PATHS.arrangement = (slug: string) => \`/arrangements/${slug}\``; `invalidateArrangement(id, slug, showSlug?, previousSlug?)` expires both paths; update all callers (grep `invalidateArrangement(`).
- Sitemap: `SitemapEntries.arrangements: { slug: string; updatedAt: string | null }[]`; `app/sitemap.ts` maps to `/arrangements/${slug}`; update `robots-sitemap.test.ts` mock and expectation (`/arrangements/pipeline`).
- Replace every link builder that used the id (show page part cards, arrangement list cards, admin links can stay on id if they hit admin routes; public ones must use slug).

- [ ] **Step 5: Run tests, typecheck, lint, build**

Run: `npx vitest run && npm run typecheck && npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add drizzle lib app components
git commit -m "Arrangements get slugs: /arrangements/<slug>, 308 from numeric ids, sitemap and links updated"
```

---

### Task 8: Arrangement indexability rule

**Files:**
- Create: `lib/seo/indexable.ts`
- Modify: `app/arrangements/[slug]/page.tsx` (`noindex` when not indexable), `lib/services/sitemap.ts` (select `description`, compute `indexable`), `app/sitemap.ts` (filter), `lib/seo/llms.ts` (unchanged; arrangements are not listed there)
- Test: `lib/seo/__tests__/indexable.test.ts`, extend `app/__tests__/robots-sitemap.test.ts`, extend `app/arrangements/__tests__/slug-route.test.ts`

**Interfaces:**
- Produces: `isIndexableArrangement(description: string | null | undefined): boolean` (≥ 120 words). `MIN_ARRANGEMENT_WORDS = 120` exported.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/seo/__tests__/indexable.test.ts
import { describe, expect, it } from 'vitest'
import { isIndexableArrangement, MIN_ARRANGEMENT_WORDS } from '@/lib/seo/indexable'
describe('isIndexableArrangement', () => {
  it('needs at least 120 words', () => {
    expect(MIN_ARRANGEMENT_WORDS).toBe(120)
    expect(isIndexableArrangement(null)).toBe(false)
    expect(isIndexableArrangement('short text')).toBe(false)
    expect(isIndexableArrangement(Array(120).fill('word').join(' '))).toBe(true)
  })
})
```

Add to `slug-route.test.ts`: with the mocked arrangement's `description: null`, `generateMetadata` returns `robots.index === false` and `robots.follow === true`; with a 130-word description, `robots.index === true`.

Add to `robots-sitemap.test.ts`: mock `arrangements: [{ slug: 'pipeline', indexable: true, updatedAt: null }, { slug: 'thin', indexable: false, updatedAt: null }]`; expect `/arrangements/pipeline` present and `/arrangements/thin` absent.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/seo/__tests__/indexable.test.ts app/arrangements app/__tests__/robots-sitemap.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// lib/seo/indexable.ts
/**
 * An arrangement page is worth indexing only once it says something: a
 * template line ("Custom arrangement of X by Y") is a thin duplicate of the
 * show page. Under the threshold the page renders, is linked, and is
 * noindex,follow; it is also left out of the sitemap.
 */
export const MIN_ARRANGEMENT_WORDS = 120
export function isIndexableArrangement(description: string | null | undefined): boolean {
  return (description ?? '').trim().split(/\s+/).filter(Boolean).length >= MIN_ARRANGEMENT_WORDS
}
```

Page: `buildMetadata({ ..., noindex: !isIndexableArrangement(arr.description) })` (the helper already maps `noindex` to `robots.index=false, follow=true`). Sitemap service selects `description` and returns `indexable: isIndexableArrangement(description)`; `app/sitemap.ts` filters `.filter((a) => a.indexable)`.

- [ ] **Step 4: Run tests**

Run: `npx vitest run && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/seo app lib/services/sitemap.ts
git commit -m "Arrangement pages index only with 120+ words of real description; thin ones noindex,follow and out of the sitemap"
```

---

### Task 9: Collections v2 (config shape, filters, publish rule, helper)

**Files:**
- Modify: `lib/collections.ts` (new `CollectionConfig`, 14 entries, `publishedCollections()`, `collectionsForShow()`)
- Modify: `lib/services/shows.ts` (`ShowFilter` gains `tags?: string[]` all-of and `yearMin?: number`; `fetchShowsByFilter` drops `limit: 12` → `limit: 60`; new `getCollectionCounts()` cached read returning `{ [slug]: number }`)
- Modify: `lib/services/invalidate.ts` (`collectionPaths` uses all configured slugs, published or not, so a newly-qualifying collection refreshes)
- Create: `content/collections/<slug>.md` × 14 (intro copy, 300–500 words each, and 3 FAQs in a `---faq---` tail) — the copy is supplied in `docs/superpowers/plans/2026-10-09-seo-content-collections.md` (written by the plan author before this task runs; the executor copies each block into its file verbatim)
- Create: `lib/content/collections.ts` (reads the 14 markdown files at build time with `fs`, server-only; parses intro + FAQ)
- Test: `lib/__tests__/collections.test.ts`, `lib/services/__tests__/shows-filter.test.ts` (extend existing filter tests if present), `lib/content/__tests__/collections-content.test.ts`

**Interfaces:**
- Produces:

```ts
export interface CollectionConfig {
  slug: string
  title: string          // <title>
  h1: string
  description: string    // meta description, 120–155 chars
  group: 'level' | 'size' | 'theme' | 'season'
  keywords: string[]
  filter: { difficulty?: ShowDifficulty; tags?: string[]; yearMin?: number }
  relatedCollections: string[]   // slugs
  relatedArticles: { title: string; href: string }[]
}
export const collections: CollectionConfig[]            // all 14
export const MIN_COLLECTION_SHOWS = 2
export function getCollectionBySlug(slug: string): CollectionConfig | undefined
export function collectionsForShow(show: { difficulty: string | null; year: number | null; tagNames: string[] }): CollectionConfig[]
export async function publishedCollections(): Promise<CollectionConfig[]>   // count >= MIN_COLLECTION_SHOWS, via getCollectionCounts()
```

  and in `lib/content/collections.ts`: `getCollectionContent(slug): { intro: string; faq: Faq[] }` (markdown-lite: same `parseProgramNotes` parser for the intro).

- [ ] **Step 1: Write the failing tests**

```ts
// lib/__tests__/collections.test.ts
import { describe, expect, it } from 'vitest'
import { collections, collectionsForShow, getCollectionBySlug, MIN_COLLECTION_SHOWS } from '@/lib/collections'

describe('collections config', () => {
  it('has the 14 launch collections with unique slugs and groups', () => {
    expect(collections).toHaveLength(14)
    expect(new Set(collections.map((c) => c.slug)).size).toBe(14)
    for (const c of collections) {
      expect(c.description.length).toBeGreaterThanOrEqual(100)
      expect(c.description.length).toBeLessThanOrEqual(160)
      expect(['level', 'size', 'theme', 'season']).toContain(c.group)
      for (const r of c.relatedCollections) expect(getCollectionBySlug(r)).toBeDefined()
    }
    expect(MIN_COLLECTION_SHOWS).toBe(2)
  })
  it('maps a show to every collection whose filter it satisfies', () => {
    const slugs = collectionsForShow({ difficulty: 'Beginner', year: 2025, tagNames: ['Theme: Space', 'Small Band'] }).map((c) => c.slug)
    expect(slugs).toEqual(expect.arrayContaining(['easy-marching-band-shows', 'small-band-marching-band-shows', 'space-marching-band-shows', 'new-marching-band-shows-2027']))
    expect(slugs).not.toContain('grade-3-marching-band-shows')
  })
})
```

```ts
// lib/content/__tests__/collections-content.test.ts
import { describe, expect, it } from 'vitest'
import { collections } from '@/lib/collections'
import { getCollectionContent } from '@/lib/content/collections'
describe('collection content files', () => {
  for (const c of collections) {
    it(`${c.slug} has 300+ words of intro and 3 FAQs`, () => {
      const { intro, faq } = getCollectionContent(c.slug)
      expect(intro.split(/\s+/).length).toBeGreaterThanOrEqual(300)
      expect(faq).toHaveLength(3)
      expect(intro + faq.map((f) => f.answer).join(' ')).not.toContain('$')
    })
  }
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/__tests__/collections.test.ts lib/content/__tests__/collections-content.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the config**

The 14 entries (slugs are final; keep the four existing slugs so no URLs change, except `small-band-marching-shows` → `small-band-marching-band-shows` **with a 308** added in `proxy.ts` next to the `/shows/<id>` rule):

| slug | group | h1 | filter |
|---|---|---|---|
| `easy-marching-band-shows` | level | Easy Marching Band Shows (Grade 2) | `{ difficulty: 'Beginner' }` |
| `grade-3-marching-band-shows` | level | Grade 3 Marching Band Shows | `{ difficulty: 'Intermediate' }` |
| `competitive-marching-band-shows` | level | Competitive Marching Band Shows (Grade 4–5) | `{ difficulty: 'Advanced' }` |
| `small-band-marching-band-shows` | size | Marching Band Shows for Small Bands | `{ tags: ['Small Band'] }` |
| `indoor-winds-shows` | size | Indoor Winds Shows | `{ tags: ['Indoor Winds'] }` |
| `new-marching-band-shows-2027` | season | New Marching Band Shows for 2027 | `{ yearMin: 2025 }` |
| `space-marching-band-shows` | theme | Space and Sky Marching Band Shows | `{ tags: ['Theme: Space'] }` |
| `western-marching-band-shows` | theme | Western and Americana Marching Band Shows | `{ tags: ['Theme: Western'] }` |
| `dark-marching-band-shows` | theme | Dark and Haunting Marching Band Shows | `{ tags: ['Theme: Dark'] }` |
| `rock-and-pop-marching-band-shows` | theme | Rock and Pop Marching Band Shows | `{ tags: ['Theme: Rock & Pop'] }` |
| `art-marching-band-shows` | theme | Art and Color Marching Band Shows | `{ tags: ['Theme: Art'] }` |
| `classical-marching-band-shows` | theme | Classical and Opera Marching Band Shows | `{ tags: ['Theme: Classical'] }` |
| `nature-marching-band-shows` | theme | Nature and Seasons Marching Band Shows | `{ tags: ['Theme: Nature'] }` |
| `story-marching-band-shows` | theme | Story-Driven and Theatrical Marching Band Shows | `{ tags: ['Theme: Story'] }` |

`title` = `${h1} | Bright Designs` when ≤ 60 chars, else `h1` alone. `description` and `keywords` per entry come from the content file's first paragraph (first 150 chars at a word boundary) and the spec's keyword map; `relatedCollections`: level ↔ size ↔ season cross-links (each level links the other two levels + small band + new-for-2027; each theme links two neighbouring themes + its most common level); `relatedArticles`: `[{ title: 'How to Choose a Marching Band Show Designer', href: '/blog/how-to-choose-a-designer' }]` for all (Plan 2 adds more).

```ts
export const MIN_COLLECTION_SHOWS = 2

export function matchesFilter(show: { difficulty: string | null; year: number | null; tagNames: string[] }, filter: CollectionConfig['filter']): boolean {
  if (filter.difficulty && show.difficulty !== filter.difficulty) return false
  if (filter.yearMin && !(show.year && show.year >= filter.yearMin)) return false
  if (filter.tags && !filter.tags.every((t) => show.tagNames.includes(t))) return false
  return true
}

export function collectionsForShow(show: { difficulty: string | null; year: number | null; tagNames: string[] }): CollectionConfig[] {
  return collections.filter((c) => matchesFilter(show, c.filter))
}

/** Collections with enough shows to be a real landing page. */
export async function publishedCollections(): Promise<CollectionConfig[]> {
  const counts = await getCollectionCounts()
  return collections.filter((c) => (counts[c.slug] ?? 0) >= MIN_COLLECTION_SHOWS)
}
```

`getCollectionCounts` in `lib/services/shows.ts`: one query of all shows with `difficulty`, `year`, tag names (`SUMMARY_COLUMNS` + tags relation, no limit), then `matchesFilter` per collection; `cachedRead('collection-counts-v1', ..., { tags: () => [TAGS.shows, TAGS.tags] })`. `fetchShowsByFilter` implements `tags` (all-of, one `exists` per tag) and `yearMin` (`gte(shows.year, n)`), ordered `desc(shows.year), desc(shows.createdAt)`, `limit: 60`.

`lib/content/collections.ts`:

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Faq } from '@/lib/content/faqs'

/** content/collections/<slug>.md: intro text, then "---faq---", then "Q: …" / "A: …" pairs. */
export function getCollectionContent(slug: string): { intro: string; faq: Faq[] } {
  const raw = readFileSync(join(process.cwd(), 'content', 'collections', `${slug}.md`), 'utf8')
  const [intro, faqRaw = ''] = raw.split(/^---faq---$/m)
  const faq: Faq[] = []
  const re = /^Q:\s*(.+)\n(?:A:\s*)([\s\S]+?)(?=\nQ:|\s*$)/gm
  for (let m = re.exec(faqRaw); m; m = re.exec(faqRaw)) faq.push({ question: m[1].trim(), answer: m[2].trim() })
  return { intro: intro.trim(), faq }
}
```

Content files: copy each collection's block from the supplied `seo-content/collections.md` into `content/collections/<slug>.md` verbatim.

- [ ] **Step 4: Run tests**

Run: `npx vitest run lib && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib content proxy.ts
git commit -m "Collections v2: 14 data-driven collections with tag/year filters, publish rule, content files"
```

---

### Task 10: Collection pages, index, sitemap, llms

**Files:**
- Modify: `app/collections/[slug]/page.tsx` (intro, FAQ, related, schemas, `path`, 404 when unpublished, `generateStaticParams` from `publishedCollections()`)
- Modify: `app/collections/page.tsx` (grouped index with 150 words of copy; only published)
- Modify: `app/sitemap.ts`, `app/llms.txt/route.ts` (`publishedCollections()`), `app/__tests__/robots-sitemap.test.ts`, `app/__tests__/llms.test.ts`
- Modify: `app/shows/[slug]/page.tsx` (swap the inline filter from Task 6 for `collectionsForShow` ∩ published)
- Test: `app/collections/__tests__/collection-page.test.tsx` (new)

- [ ] **Step 1: Write the failing test**

```tsx
// app/collections/__tests__/collection-page.test.tsx
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

const show = (id: number, title: string) => ({ id, title, slug: title.toLowerCase().replace(/\s+/g, '-'), description: 'd', year: 2025, difficulty: 'Beginner', duration: '7:00', thumbnailUrl: null, graphicUrl: null, featured: false, createdAt: null, showsToTags: [], arrangements: [] })
vi.mock('@/lib/services/shows', () => ({
  getShowsByFilter: vi.fn(async (f: { difficulty?: string }) => (f.difficulty === 'Beginner' ? [show(1, 'Ride the Wave'), show(2, 'Excalibur')] : [])),
  getCollectionCounts: vi.fn(async () => ({ 'easy-marching-band-shows': 2 })),
}))
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NOT_FOUND') } }))
beforeEach(() => vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://brightdesigns.band'))

describe('/collections/[slug]', () => {
  it('renders intro, shows, FAQ schema, ItemList and self-canonical', async () => {
    const { default: Page, generateMetadata } = await import('../[slug]/page')
    const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ slug: 'easy-marching-band-shows' }) }))
    expect(html).toContain('Ride the Wave')
    expect(html).toContain('"@type":"FAQPage"')
    expect(html).toContain('"@type":"ItemList"')
    expect(html).toContain('"@type":"CollectionPage"')
    const m = await generateMetadata({ params: Promise.resolve({ slug: 'easy-marching-band-shows' }) })
    expect(m.alternates?.canonical).toBe('https://brightdesigns.band/collections/easy-marching-band-shows')
  })
  it('404s a collection under the publish threshold', async () => {
    const { default: Page } = await import('../[slug]/page')
    await expect(Page({ params: Promise.resolve({ slug: 'indoor-winds-shows' }) })).rejects.toThrow('NOT_FOUND')
  })
})
```

Extend `robots-sitemap.test.ts` and `llms.test.ts`: mock `getCollectionCounts` so exactly 3 collections qualify; expect exactly those 3 `/collections/` URLs in the sitemap and `llms.txt`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/collections app/__tests__`
Expected: FAIL.

- [ ] **Step 3: Implement**

`app/collections/[slug]/page.tsx`:

- `generateStaticParams`: `(await publishedCollections()).map((c) => ({ slug: c.slug }))` in try/catch returning `[]` on failure (same pattern as the show page).
- `generateMetadata`: `buildMetadata({ title: collection.title, description: collection.description, keywords: collection.keywords, path: \`/collections/${slug}\` })`; `noindex: true` + "Collection not found" when unknown.
- Page: `const counts = await getCollectionCounts(); if ((counts[slug] ?? 0) < MIN_COLLECTION_SHOWS) notFound()`; `const { intro, faq } = getCollectionContent(slug)`; shows via `getShowsByFilter(collection.filter)`.
- Layout: hero (H1 + first paragraph of the intro as the lede), then the show grid, then `<section>` "About these shows" rendering the rest of the intro through `ProgramNotes` (parse with `parseProgramNotes(intro)`), then an FAQ section (H2 "Questions directors ask", each Q as `<h3>`), then "Related collections" links and "Read next" article links. Keep the resale callout (`ResaleCallout kind="show"` variant or the existing banner) but change its text to: "Every show here is for sale as-is, as arrangements for a build-your-own show, or as the start of a partial custom show. Pricing is quoted per program."
- Schemas: `createBreadcrumbSchema([Home, Shows, Collections, h1])`, `createFAQSchema(faq)`, and a new `createCollectionPageSchema({ name: h1, description, url, items: shows.map((s) => ({ name: s.title, url: \`/shows/${s.slug}\` })) })` added to `lib/seo/structured-data.ts` that returns `{ '@type': 'CollectionPage', name, description, url, mainEntity: { '@type': 'ItemList', itemListElement: [{ '@type': 'ListItem', position, name, url }] } }`.

`app/collections/page.tsx`: group `await publishedCollections()` by `group` under H2s "By difficulty", "By band size", "By theme", "By season" with an intro paragraph (verbatim):

> Collections are the quickest way into the catalog. Every show here is a complete marching band production we wrote for a real program, and every one is for sale as-is, as separate arrangements, or as the start of a partial custom show. Start with your band's grade level or size, or browse by theme if you already know the story you want to tell. Pricing is quoted per program; tell us which show you are looking at and we will send a quote within a day.

Sitemap and `llms.txt` route switch from `collections` to `await publishedCollections()`; `invalidate.ts` keeps expiring all 14 paths.

Show page: `const collectionLinks = (await publishedCollections()).filter((c) => matchesFilter({ difficulty: displayDifficulty || null, year: show.year, tagNames }, c.filter))`.

- [ ] **Step 4: Run tests, typecheck, lint, build**

Run: `npx vitest run && npm run typecheck && npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app lib
git commit -m "Collection pages with intro copy, FAQ and CollectionPage schema; grouped index; publish rule in sitemap and llms"
```

---

### Task 11: Theme tags and data backfill script

**Files:**
- Create: `scripts/seo/apply-theme-tags.ts` (reads `scripts/seo/theme-tags.json`, creates missing tags, links shows; idempotent; `--dry-run` default, `--apply` writes)
- Create: `scripts/seo/theme-tags.json` with the mapping below
- Test: `scripts/seo/__tests__/theme-tags.test.ts` (mapping file is valid: every slug exists in the live export? no network in tests, so: every entry has a non-empty slug and only known theme names)

Mapping (`slug` → themes), from show titles and descriptions as of 2026-10-09:

```json
{
  "themes": ["Theme: Space", "Theme: Western", "Theme: Dark", "Theme: Rock & Pop", "Theme: Art", "Theme: Classical", "Theme: Nature", "Theme: Story"],
  "shows": {
    "pale-blue-dot": ["Theme: Space"], "worlds-apart": ["Theme: Space"], "true-north": ["Theme: Nature", "Theme: Space"],
    "gold-rush": ["Theme: Western", "Theme: Story"], "off-the-rails": ["Theme: Western", "Theme: Story"], "4-seasons-of-kansas": ["Theme: Nature", "Theme: Western"],
    "the-uninvited": ["Theme: Dark"], "immortal": ["Theme: Dark"], "gargoyle": ["Theme: Dark", "Theme: Story"], "undercurrents": ["Theme: Dark", "Theme: Nature"], "strings-of-fate": ["Theme: Dark", "Theme: Story"],
    "turn-it-up": ["Theme: Rock & Pop"], "takeover": ["Theme: Rock & Pop"], "make-some-noise": ["Theme: Rock & Pop"], "fast-lane": ["Theme: Rock & Pop", "Theme: Story"], "ride-the-wave": ["Theme: Rock & Pop", "Theme: Nature"], "in-the-key-of-cool": ["Theme: Rock & Pop"],
    "dot-by-dot": ["Theme: Art"], "art-of-rebellion": ["Theme: Art", "Theme: Story"], "drawn-to-life": ["Theme: Art", "Theme: Story"], "in-living-color": ["Theme: Art"],
    "a-night-at-the-opera": ["Theme: Classical", "Theme: Story"], "excalibur": ["Theme: Classical", "Theme: Story"], "thats-amore": ["Theme: Classical", "Theme: Story"], "no-strings-attached": ["Theme: Classical", "Theme: Story"],
    "feathered-flame": ["Theme: Nature", "Theme: Story"], "the-caterpillar": ["Theme: Nature"], "apex": ["Theme: Nature", "Theme: Dark"], "head-in-the-clouds": ["Theme: Nature", "Theme: Story"],
    "lunch-atop-a-skyscraper": ["Theme: Story"], "let-them-eat-cake": ["Theme: Story", "Theme: Classical"], "the-times": ["Theme: Story"], "spices-perfumes-toxins": ["Theme: Story", "Theme: Dark"], "aromatic": ["Theme: Story", "Theme: Classical"]
  }
}
```

- [ ] **Step 1: Write the failing test**

```ts
// scripts/seo/__tests__/theme-tags.test.ts
import { describe, expect, it } from 'vitest'
import mapping from '../theme-tags.json'
describe('theme-tags.json', () => {
  it('uses only declared themes and covers 34 shows', () => {
    expect(Object.keys(mapping.shows)).toHaveLength(34)
    for (const [slug, themes] of Object.entries(mapping.shows)) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      expect(themes.length).toBeGreaterThan(0)
      for (const t of themes) expect(mapping.themes).toContain(t)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run scripts/seo`
Expected: FAIL (file missing). (If `vitest.config.ts` excludes `scripts/`, add `scripts/**/__tests__/**` to its `include`.)

- [ ] **Step 3: Implement the script**

`scripts/seo/apply-theme-tags.ts` (run with `tsx`, uses `DATABASE_URL` like `scripts/apply-sql-migrations.ts`): for each theme, `INSERT INTO tags (name) ... ON CONFLICT (name) DO NOTHING`; for each show slug, look up `shows.id`; skip with a warning when the slug is unknown; `INSERT INTO shows_to_tags (show_id, tag_id) ... ON CONFLICT DO NOTHING`. Print a table of `slug → added/skipped`. Default dry-run prints what would change; `--apply` writes. After `--apply`, print: "Cached reads expire within 1 hour (revalidate = 3600); trigger a Netlify deploy to refresh sooner."

- [ ] **Step 4: Run test and a dry run**

Run: `npx vitest run scripts/seo && npx tsx scripts/seo/apply-theme-tags.ts`
Expected: test PASS; dry run lists 34 shows and 8 tags with no errors (requires `DATABASE_URL` in `.env.local`; if absent, the script prints the plan from the JSON only).

- [ ] **Step 5: Commit**

```bash
git add scripts/seo vitest.config.ts
git commit -m "Theme tags: mapping for all 34 shows and an idempotent apply script"
```

---

### Task 12: Deploy checklist, Lighthouse and PR

**Files:**
- Modify: `docs/` (add `docs/seo-catalog.md`: the field vocabulary, the indexability rule, the collection publish rule, how to add a collection)
- PR body with the checklist below

- [ ] **Step 1: Full verification**

Run: `npx vitest run && npm run typecheck && npm run lint && npm run build && npm run perf:ci`
Expected: all green; Lighthouse script budget under 425 KiB on home, /shows, a show page, a collection page.

- [ ] **Step 2: Write docs/seo-catalog.md** (≈ 300 words: the three show fields and the program-notes format; the arrangement 120-word rule; the 2-show collection rule and the table of 14 slugs/filters; `scripts/seo/apply-theme-tags.ts`; where collection copy lives).

- [ ] **Step 3: Commit and open the PR**

```bash
git add docs/seo-catalog.md
git commit -m "Document the SEO catalog rules"
git push -u origin seo/catalog
gh pr create --title "SEO catalog: canonicals, titles, program notes, arrangement slugs, collections v2" --body-file docs/superpowers/plans/pr-body-seo-catalog.md
```

PR body checklist (write to `docs/superpowers/plans/pr-body-seo-catalog.md`):

```
## Deploy order (migrations BEFORE merge, like SP3)
1. `npm run db:migrate:status` then `npm run db:migrate` applies 2026-10-10_shows_program_notes.sql and 2026-10-10_arrangements_slug.sql (idempotent; backfills arrangement slugs).
2. Merge. Netlify deploy.
3. `npx tsx scripts/seo/apply-theme-tags.ts --apply` (DATABASE_URL from Netlify env).
4. Smoke: curl -sI https://brightdesigns.band/arrangements/2 → 308 to /arrangements/<slug>; curl -s https://brightdesigns.band/collections/easy-marching-band-shows | grep -c FAQPage → 1; curl -s https://brightdesigns.band/collections/small-band-marching-shows -o /dev/null -w '%{http_code}' → 308; `/sitemap.xml` lists only published collections and only indexable arrangements.
5. Search Console: resubmit sitemap; request indexing for /shows/* and /collections/*.
## Closes
Part of #62 (technical half of SP5).
```

- [ ] **Step 4: Request review**

Use the superpowers:requesting-code-review flow on the whole branch before merge.
