import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/roles';
import { SuccessResponse, ErrorResponse, UnauthorizedResponse, ForbiddenResponse, BadRequestResponse } from '@/lib/utils/api-helpers';
import { files, shows } from '@/lib/database/schema';
import { eq, inArray } from 'drizzle-orm';
import { STORAGE_BUCKET, withRootPrefix } from '@/lib/storage';

type BackfillMapping = {
  showId?: number;
  title?: string;
  files?: string[]; // explicit storage paths
  prefix?: string;  // override prefix for this show
};

function normalize(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .trim();
}

function chooseThumbnail(candidates: { name: string; url: string; storagePath: string }[]) {
  if (candidates.length === 0) return null;
  const preferred = candidates.find(c => /(cover|thumb|thumbnail|hero)/i.test(c.name));
  return preferred || candidates[0];
}

export async function POST(request: Request) {
  try {
    let createClient: any;
    try {
      ({ createClient } = await import('@/lib/utils/supabase/server'));
    } catch (e) {
      console.error('Supabase client import failed.', e);
      return ErrorResponse('Auth provider not configured');
    }
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return UnauthorizedResponse();
    }
    if (!requirePermission(session.user.email, 'canManageShows')) {
      return ForbiddenResponse();
    }

    let payload: any = {};
    try {
      payload = await request.json();
    } catch {
      // ignore, allow empty body
    }

    const {
      mode = 'prefix', // 'prefix' | 'search'
      prefixTemplate = 'shows/{showId}/image',
      prefixes = [] as string[], // used in 'search' mode
      mapping = [] as BackfillMapping[], // manual overrides
      setThumbnail = true,
      onlyMissing = true, // if true, only set thumbnail when missing
      limitPerShow = 1000,
    } = payload || {};

    // Load shows
    const { data: showRows, error: showErr } = await supabase
      .from('shows')
      .select('id,title,thumbnail_url');
    if (showErr) {
      console.error('Failed to fetch shows:', showErr.message);
      return ErrorResponse('Failed to fetch shows');
    }

    let db: any;
    try {
      ({ db } = await import('@/lib/database'));
    } catch (e) {
      console.error('Database import failed (likely no DATABASE_URL).', e);
      return ErrorResponse('Database not configured');
    }

    const results: any[] = [];

    for (const s of showRows || []) {
      const showId: number = s.id;
      const title: string = s.title || '';
      const titleSlug = normalize(title);
      const mappingEntry = mapping.find((m: BackfillMapping) =>
        (typeof m.showId === 'number' && m.showId === showId) ||
        (m.title && normalize(m.title) === titleSlug)
      );

      const found: { name: string; url: string; storagePath: string }[] = [];

      // If explicit files are provided in mapping, use those directly
      if (mappingEntry?.files && Array.isArray(mappingEntry.files)) {
        for (const storagePath of mappingEntry.files) {
          const name = storagePath.split('/').pop() || storagePath;
          const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(withRootPrefix(storagePath));
          found.push({ name, url: pub.publicUrl, storagePath });
        }
      } else {
        // Determine prefixes to scan
        const prefixesToScan: string[] = [];
        if (mappingEntry?.prefix) {
          prefixesToScan.push(mappingEntry.prefix.replace('{showId}', String(showId)).replace('{titleSlug}', titleSlug));
        } else if (mode === 'prefix') {
          const computed = String(prefixTemplate)
            .replace('{showId}', String(showId))
            .replace('{titleSlug}', titleSlug);
          prefixesToScan.push(computed);
        } else if (mode === 'search') {
          prefixesToScan.push(...(prefixes || []));
        }

        for (const pfx of prefixesToScan) {
          // List files one level under the prefix
          const { data: list, error: listErr } = await supabase.storage
            .from(STORAGE_BUCKET)
            .list(withRootPrefix(pfx), {
              limit: limitPerShow,
              sortBy: { column: 'name', order: 'asc' },
            });
          if (listErr) {
            console.warn(`List error at "${pfx}":`, listErr.message);
            continue;
          }
          for (const obj of list || []) {
            // Skip folders (heuristic: entries without a '.' might be directories)
            if (typeof obj.name !== 'string') continue;
            const hasExtension = obj.name.includes('.');
            if (!hasExtension) continue;
            const isImage = /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(obj.name);
            if (!isImage) continue;

            if (mode === 'search') {
              const nameNorm = normalize(obj.name);
              if (!nameNorm.includes(titleSlug)) {
                continue;
              }
            }

            const storagePath = `${pfx}/${obj.name}`;
            const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(withRootPrefix(storagePath));
            found.push({ name: obj.name, url: pub.publicUrl, storagePath });
          }
        }
      }

      // Deduplicate by storagePath
      const dedupMap = new Map<string, { name: string; url: string; storagePath: string }>();
      for (const f of found) {
        if (!dedupMap.has(f.storagePath)) {
          dedupMap.set(f.storagePath, f);
        }
      }
      const deduped = Array.from(dedupMap.values());

      // Filter out any already-recorded storage paths
      const storagePaths = deduped.map(f => f.storagePath);
      let existingSet = new Set<string>();
      if (storagePaths.length > 0) {
        const existing = await db
          .select({ storagePath: files.storagePath })
          .from(files)
          .where(inArray(files.storagePath, storagePaths));
        existingSet = new Set(existing.map((e: any) => e.storagePath));
      }

      const toInsert = deduped.filter(f => !existingSet.has(f.storagePath));

      // Insert new file records
      let insertedCount = 0;
      if (toInsert.length > 0) {
        const rows = toInsert.map((f, idx) => ({
          fileName: f.name,
          originalName: f.name,
          fileType: 'image' as const,
          fileSize: 0,
          mimeType: 'image/*',
          url: f.url,
          storagePath: f.storagePath,
          showId,
          arrangementId: null,
          isPublic: true,
          description: null,
          displayOrder: idx,
        }));
        const inserted = await db.insert(files).values(rows).returning();
        insertedCount = inserted.length;
      }

      // Optionally set thumbnail
      let thumbnailSet = false;
      if (setThumbnail && (!s.thumbnail_url || !onlyMissing)) {
        const allCandidates = deduped.length > 0 ? deduped : [];
        const chosen = chooseThumbnail(allCandidates);
        if (chosen) {
          await db.update(shows).set({ thumbnailUrl: chosen.url }).where(eq(shows.id, showId));
          thumbnailSet = true;
        }
      }

      results.push({
        showId,
        title,
        scanned: deduped.length,
        inserted: insertedCount,
        thumbnailSet,
      });
    }

    return SuccessResponse({ results });
  } catch (error) {
    console.error('Backfill error:', error);
    return ErrorResponse('Failed to backfill images');
  }
}


