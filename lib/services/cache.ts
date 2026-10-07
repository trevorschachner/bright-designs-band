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

const warnedKeys = new Set<string>();

/**
 * Called when a read would take the build fallback. A production deploy
 * (Netlify CONTEXT=production) must never ship empty prerendered pages, so it
 * fails the build. Anywhere else (CI, previews, local) it warns once per key
 * and the fallback is used.
 */
function onBuildWithoutDb(key: string): void {
  if (process.env.CONTEXT === 'production') {
    throw new Error('DATABASE_URL is required for a production build');
  }
  if (warnedKeys.has(key)) return;
  warnedKeys.add(key);
  console.warn(`[cachedRead] ${key}: no database during the build; prerendering the empty fallback.`);
}

/** Test hook: forget which keys have warned. */
export function resetBuildWarningsForTests(): void {
  warnedKeys.clear();
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
    if (databaseUnavailableAtBuild()) {
      onBuildWithoutDb(key);
      return Promise.resolve(options.atBuildWithoutDb);
    }
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
