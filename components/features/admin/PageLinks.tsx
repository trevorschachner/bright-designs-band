import Link from 'next/link';
import { Button } from '@/components/ui/button';

/** `?page=` from a server page's searchParams: a positive integer, else 1. */
export function parsePage(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

/**
 * Previous / next links for a server-rendered admin list. `extra` carries the
 * other query params (e.g. `q`) so paging keeps the search.
 */
export function PageLinks({
  basePath,
  page,
  totalPages,
  total,
  extra = {},
}: {
  basePath: string;
  page: number;
  totalPages: number;
  total: number;
  extra?: Record<string, string | undefined>;
}) {
  const href = (p: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(extra)) if (value) params.set(key, value);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 px-2 py-3 text-sm text-muted-foreground">
      <span>
        {total} {total === 1 ? 'entry' : 'entries'} · page {Math.min(page, Math.max(totalPages, 1))} of {Math.max(totalPages, 1)}
      </span>
      <span className="flex gap-2">
        {page > 1 ? (
          <Button asChild variant="outline" size="sm"><Link href={href(page - 1)}>Previous</Link></Button>
        ) : (
          <Button variant="outline" size="sm" disabled>Previous</Button>
        )}
        {page < totalPages ? (
          <Button asChild variant="outline" size="sm"><Link href={href(page + 1)}>Next</Link></Button>
        ) : (
          <Button variant="outline" size="sm" disabled>Next</Button>
        )}
      </span>
    </nav>
  );
}
