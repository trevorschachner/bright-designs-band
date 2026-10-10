# SEO catalog rules

## Show fields
- `program_notes`: first line is the concept sentence. After a blank line, use the headings "The music", "Who it suits" and "What you get". Bullets start with `- `. Unknown headings render under the about section.
- `ensemble_size`: `small`, `medium` or `large`.
- `includes`: comma-separated subset of `SHOW_INCLUDES` in `lib/validation/enums.ts`: winds, percussion, sound design, drill, choreography, props, graphic.

## Arrangements
Pages live at `/arrangements/<slug>`; numeric ids answer 308 to the slug. A page is indexable only with 120+ words of description (`lib/seo/indexable.ts`). Thinner pages are `noindex,follow` and left out of the sitemap.

## Collections
A collection page publishes only when at least 2 shows match (`MIN_COLLECTION_SHOWS`). Unpublished slugs return 404 and stay out of the sitemap and llms.txt. Config is in `lib/collections.ts`.

| Slug | Filter |
|---|---|
| `easy-marching-band-shows` | difficulty: 'Beginner' |
| `grade-3-marching-band-shows` | difficulty: 'Intermediate' |
| `competitive-marching-band-shows` | difficulty: 'Advanced' |
| `small-band-marching-band-shows` | tags: ['Small Band'] |
| `indoor-winds-shows` | tags: ['Indoor Winds'] |
| `new-marching-band-shows-2027` | yearMin: 2025 |
| `space-marching-band-shows` | tags: ['Theme: Space'] |
| `western-marching-band-shows` | tags: ['Theme: Western'] |
| `dark-marching-band-shows` | tags: ['Theme: Dark'] |
| `rock-and-pop-marching-band-shows` | tags: ['Theme: Rock & Pop'] |
| `art-marching-band-shows` | tags: ['Theme: Art'] |
| `classical-marching-band-shows` | tags: ['Theme: Classical'] |
| `nature-marching-band-shows` | tags: ['Theme: Nature'] |
| `story-marching-band-shows` | tags: ['Theme: Story'] |

Copy lives in `content/collections/<slug>.md`. FAQ entries go after a `---faq---` line as `Q:` and `A:` pairs.

## Theme tags
`npx tsx scripts/seo/apply-theme-tags.ts` is a dry run and writes nothing. Add `--apply` to write in one transaction. It is idempotent.
