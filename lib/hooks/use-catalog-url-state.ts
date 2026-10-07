'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { FilterField, FilterState } from '@/lib/filters/types';
import {
  CATALOG_DEFAULT_LIMIT,
  parseCatalogQuery,
  serializeCatalogQuery,
} from '@/lib/filters/catalog-params';

/** How long a filter change waits for the next one before it reaches the URL. */
export const URL_DEBOUNCE_MS = 300;

interface Options {
  filterFields: FilterField[];
  defaultLimit?: number;
}

interface SetOptions {
  /** Skip the debounce (Enter in the search box, Clear all). */
  immediate?: boolean;
}

/**
 * Catalog filter state that lives in the URL. The server page reads the same
 * query string and renders the matching list, so a filter change is exactly
 * one navigation: `router.replace(pathname?qs, { scroll: false })` after one
 * 300 ms debounce. There is no client fetch.
 *
 * Local state mirrors the URL so inputs respond at once; it resyncs from the
 * URL (back/forward, a pagination link) whenever no change is pending.
 */
export function useCatalogUrlState({ filterFields, defaultLimit = CATALOG_DEFAULT_LIMIT }: Options) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams?.toString() ?? '';

  const urlState = useMemo<FilterState>(
    () => parseCatalogQuery(new URLSearchParams(queryString), { fields: filterFields, defaultLimit }),
    [queryString, filterFields, defaultLimit]
  );

  const [filterState, setLocalState] = useState<FilterState>(urlState);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPending, startTransition] = useTransition();
  // The debounced commit runs after later renders; it must compare against
  // the URL as it is then, not as it was when the timer was set.
  const latest = useRef({ queryString, pathname });
  latest.current = { queryString, pathname };

  useEffect(() => {
    if (!timer.current) setLocalState(urlState);
  }, [urlState]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const commit = useCallback(
    (next: FilterState) => {
      const qs = serializeCatalogQuery(next, defaultLimit);
      const { queryString: current, pathname: path } = latest.current;
      if (qs === current) return;
      startTransition(() => {
        router.replace(qs ? `${path}?${qs}` : path, { scroll: false });
      });
    },
    [defaultLimit, router]
  );

  const setFilterState = useCallback(
    (next: FilterState, options: SetOptions = {}) => {
      setLocalState(next);
      if (timer.current) clearTimeout(timer.current);
      if (options.immediate) {
        timer.current = null;
        commit(next);
        return;
      }
      timer.current = setTimeout(() => {
        timer.current = null;
        commit(next);
      }, URL_DEBOUNCE_MS);
    },
    [commit]
  );

  /** True while a change is waiting for its debounce; inputs use it to keep their own text. */
  const hasPendingChange = useCallback(() => timer.current !== null, []);

  return { filterState, setFilterState, isPending, hasPendingChange };
}
