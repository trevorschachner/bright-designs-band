import { unstable_cache } from 'next/cache';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import { isDatabaseConfigured } from '@/lib/database';
import { shouldSkipSupabase } from '@/lib/env';

/** How long a cached public read lives before it is refreshed in the background. */
export const REVALIDATE_SECONDS = 3600;

/** Lifetime of a catalog page read with a free-text search (see README). */
export const SEARCH_REVALIDATE_SECONDS = 300;

/**
 * True while `next build` runs without a usable database: CI, and Netlify
 * builds where the env is masked. Pages prerendered then (/, /resources,
 * /collections/*) get the build fallback below instead of failing the build;
 * the first request after the hour, or the first write, replaces them.
 *
 * This is the only place a public read does not throw on a missing database.
 */
export function databaseUnavailableAtBuild(): boolean {
  if (process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD) return false;
  return shouldSkipSupabase() || !isDatabaseConfigured();
}

interface CachedReadOptions<A extends unknown[], R> {
  /** Every tag whose invalidation must drop this entry. See lib/cache-tags.ts. */
  tags: (...args: A) => string[];
  /** What to return during a build that has no database. */
  atBuildWithoutDb: R;
  /** Seconds this entry lives, per call. Defaults to REVALIDATE_SECONDS. */
  revalidate?: (...args: A) => number;
}

/**
 * A public read: cached with `unstable_cache` under `key` (plus the
 * JSON-serialised arguments, which unstable_cache appends itself), tagged,
 * revalidated hourly (or per `options.revalidate`). Errors are not caught: they propagate to the caller and
 * are never cached.
 *
 * Results pass through JSON on a cache hit, so `fn` must return JSON-safe
 * values (no Date, Map or undefined-vs-missing distinctions). Services return
 * ISO strings for timestamps for that reason.
 */
export function cachedRead<A extends unknown[], R>(
  key: string,
  fn: (...args: A) => Promise<R>,
  options: CachedReadOptions<A, R>
): (...args: A) => Promise<R> {
  return (...args: A) => {
    if (databaseUnavailableAtBuild()) return Promise.resolve(options.atBuildWithoutDb);
    return unstable_cache(fn, [key], {
      revalidate: options.revalidate?.(...args) ?? REVALIDATE_SECONDS,
      tags: options.tags(...args),
    })(...args);
  };
}

/** Date (or a string from a cache hit, or null) to an ISO string. */
export function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}
