import { unstable_cache } from 'next/cache';
import { db } from '@/lib/database';
import { readShowSheetTables, storageFromEnv } from '@/lib/export/load-show-sheet';
import { EXPORT_FILES, publicExportCsv } from '@/lib/export/public-export';
import { reportError } from '@/lib/observability/report-error';

/**
 * GET /api/export/{shows,parts,pieces,links}.csv
 *
 * Public CSVs the "Active Assets on Website" Google Sheet pulls with
 * =IMPORTDATA(...). Public fields only; see lib/export/public-export.ts.
 * Cached for an hour and dropped when an admin edit revalidates the `shows`
 * or `arrangements` tag, the same signals the rest of the site uses.
 */
export const dynamic = 'force-dynamic';

const getTables = unstable_cache(() => readShowSheetTables(db, storageFromEnv()), ['sheet-export'], {
  revalidate: 3600,
  tags: ['shows', 'arrangements'],
});

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!(EXPORT_FILES as readonly string[]).includes(file)) {
    return new Response(`Not found. Available: ${EXPORT_FILES.join(', ')}`, { status: 404 });
  }

  try {
    const csv = publicExportCsv(file, await getTables());
    return new Response(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'cache-control': 'public, max-age=0, s-maxage=300',
      },
    });
  } catch (error) {
    await reportError(error, { operation: `GET /api/export/${file}` });
    return new Response('Export failed', { status: 500 });
  }
}
