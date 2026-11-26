/**
 * Show popularity: how many people looked at or listened to each show over the
 * last 90 days, from the PostHog endpoint `show-popularity`
 * (https://us.posthog.com/project/261511/endpoints/show-popularity).
 *
 * The endpoint returns one row per key with the number of unique people:
 *   - `slug`:  visitors to /shows/<slug>
 *   - `title`: listeners to any of the show's tracks (the `showTitle` on
 *              `audio.played`; plays started on the /shows catalog never visit
 *              the show page, so they can only be matched by title)
 *
 * A show's score is visitors + listeners. Someone who did both counts twice,
 * which is intended: listening is the stronger signal.
 *
 * Written to `shows.popularity` weekly by scripts/sync-show-popularity.ts.
 */

export type PopularityRow = { keyType: 'slug' | 'title'; key: string; people: number };

export type ShowKey = { id: number; slug: string; title: string };

const normalizeTitle = (title: string) => title.trim().toLowerCase();

/** Score every show; shows nobody visited or played get 0, so stale scores are cleared. */
export function scoreShows(rows: PopularityRow[], showList: ShowKey[]): Map<number, number> {
  const bySlug = new Map<string, number>();
  const byTitle = new Map<string, number>();
  for (const row of rows) {
    if (!row.key) continue;
    const target = row.keyType === 'slug' ? bySlug : byTitle;
    const key = row.keyType === 'slug' ? row.key : normalizeTitle(row.key);
    target.set(key, (target.get(key) ?? 0) + row.people);
  }

  const scores = new Map<number, number>();
  for (const show of showList) {
    scores.set(show.id, (bySlug.get(show.slug) ?? 0) + (byTitle.get(normalizeTitle(show.title)) ?? 0));
  }
  return scores;
}

/**
 * Turn the endpoint's response into rows. Accepts `{ columns, results }` with
 * array rows (the HogQL shape) or `{ results }` with object rows.
 */
export function parseEndpointResponse(body: unknown): PopularityRow[] {
  const { columns, results } = (body ?? {}) as { columns?: string[]; results?: unknown[] };
  if (!Array.isArray(results)) throw new Error('PostHog endpoint response has no results array');

  return results.map((raw) => {
    const record: Record<string, unknown> = Array.isArray(raw)
      ? Object.fromEntries((columns ?? ['key_type', 'key', 'people']).map((c, i) => [c, raw[i]]))
      : (raw as Record<string, unknown>);
    const keyType = record.key_type;
    if (keyType !== 'slug' && keyType !== 'title') throw new Error(`Unexpected key_type: ${String(keyType)}`);
    return { keyType, key: String(record.key ?? ''), people: Number(record.people) || 0 };
  });
}
