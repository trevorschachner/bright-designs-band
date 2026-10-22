'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { recordPage } from '@/lib/page-trail';

/** Records each page view for lib/page-trail. Renders nothing. */
export function PageTrailRecorder() {
  const pathname = usePathname();
  useEffect(() => {
    recordPage();
  }, [pathname]);
  return null;
}
