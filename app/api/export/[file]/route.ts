import { db } from '@/lib/database';
import { TAGS } from '@/lib/cache-tags';
import { cachedRead } from '@/lib/services/cache';
import { readShowSheetTables, storageFromEnv, type ShowSheetTables } from '@/lib/export/load-show-sheet';
import { EXPORT_FILES, publicExportCsv } from '@/lib/export/public-export';
import { reportError } from '@/lib/observability/report-error';

/**
 * GET /api/export/{shows,parts,pieces,links}.csv
 *
 * Public CSVs the "Active Assets on Website" Google Sheet pulls with
 * =IMPORTDATA(...). Public fields only; see lib/export/public-export.ts.
 * Cached for an hour through cachedRead, tagged with every entity the export
 * reads (shows, arrangements, tags, pieces), so an admin edit to any of them
 * drops it, the same signals the rest of the site uses.
 */
export const dynamic = 'force-dynamic';

const EXPORT_TAGS = () => [TAGS.shows, TAGS.arrangements, TAGS.tags, TAGS.pieces];

const EMPTY_TABLES: ShowSheetTables = { shows: [], parts: [], pieces: [], links: [] };

const getTables = cachedRead('sheet-export-v2', () => readShowSheetTables(db, storageFromEnv()), {
  tags: EXPORT_TAGS,
  atBuildWithoutDb: EMPTY_TABLES,
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
