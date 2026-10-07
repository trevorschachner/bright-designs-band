'use client';

import { useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LimitSelectProps {
  limit: number;
  options: readonly number[];
  defaultLimit: number;
}

/**
 * Page-size select for the catalog. Writes `limit` to the URL (dropping it at
 * the default) and goes back to page 1; the server renders the new page.
 */
export function LimitSelect({ limit, options, defaultLimit }: LimitSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const onChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    const next = parseInt(value, 10);
    if (next === defaultLimit) params.delete('limit');
    else params.set('limit', String(next));
    params.delete('page');
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  return (
    <Select value={limit.toString()} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger className="w-20" aria-label="Results per page">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((n) => (
          <SelectItem key={n} value={String(n)}>
            {n}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
