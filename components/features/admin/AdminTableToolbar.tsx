'use client';

import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

/** Debounce for the search box: one request per pause in typing, not per key. */
export const SEARCH_DEBOUNCE_MS = 300;
/** Matches the server's cap on free-text search. */
export const SEARCH_MAX_CHARS = 80;

/**
 * AdminTable's search box. Reports the trimmed term after a pause in typing;
 * the table sends it as `?q=` (buildListUrl) and the endpoint filters by
 * title on the server.
 */
export function AdminTableToolbar({ resourceName, onSearch }: { resourceName: string; onSearch: (q: string) => void }) {
  const [value, setValue] = useState('');
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);
  const lastSent = useRef('');

  useEffect(() => {
    const term = value.trim();
    if (term === lastSent.current) return;
    const timer = setTimeout(() => {
      lastSent.current = term;
      onSearchRef.current(term);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="relative mb-3 max-w-sm">
      <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`Search ${resourceName} by title`}
        aria-label={`Search ${resourceName}`}
        maxLength={SEARCH_MAX_CHARS}
        className="pl-8"
      />
    </div>
  );
}
