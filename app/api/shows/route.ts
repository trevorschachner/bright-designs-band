import { shows, showArrangements, showsToTags, files } from '@/lib/database/schema';
import { NextResponse } from 'next/server';
import { revalidateTag, unstable_cache } from 'next/cache';
import { QueryBuilder, FilterUrlManager } from '@/lib/filters/query-builder';
import { count } from 'drizzle-orm/sql';
import { eq, desc } from 'drizzle-orm';
import { createClient as createServerClient } from '@/lib/utils/supabase/server';
import { requirePermission } from '@/lib/auth/roles';
import { showSchema } from '@/lib/validation/shows';
import { SuccessResponse, ErrorResponse, UnauthorizedResponse, ForbiddenResponse, BadRequestResponse } from '@/lib/utils/api-helpers';
import { STORAGE_BUCKET, withRootPrefix } from '@/lib/storage';

export const dynamic = 'force-dynamic';

const SUPABASE_STORAGE_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, '')}/storage/v1/object/public`;

function toPublicUrl(urlOrPath: string | null | undefined): string | null {
  if (!urlOrPath) return null;
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) return urlOrPath;
  try {
    return `${SUPABASE_STORAGE_BASE}/${STORAGE_BUCKET}/${withRootPrefix(urlOrPath)}`;
  } catch {
    return null;
  }
}

interface ShowQueryParams {
  search?: string;
  conditions: any[];
  sort: any[];
  page: number;
  limit: number;
  featured?: boolean;
}

async function queryShowsData(params: ShowQueryParams) {
  const { db } = await import('@/lib/database');
  const { search, conditions, sort, page, limit, featured } = params;
  const offset = (page - 1) * limit;

  const whereConditions: any[] = [];

  if (search) {
    const searchCondition = QueryBuilder.buildSearchCondition(shows, search, ['title', 'description']);
    if (searchCondition) whereConditions.push(searchCondition);
  }

  if (conditions.length > 0) {
    const filterCondition = QueryBuilder.buildWhereClause(shows, conditions);
    if (filterCondition) whereConditions.push(filterCondition);
  }

  if (featured) {
    whereConditions.push(eq(shows.featured, true));
  }

  let finalWhereClause: any;
  if (whereConditions.length > 0) {
    const { and } = await import('drizzle-orm');
    finalWhereClause = whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions);
  }

  const orderBy = sort?.length > 0
    ? QueryBuilder.buildOrderByClause(shows, sort)
    : [shows.displayOrder, desc(shows.createdAt)];

  const countQuery = db.select({ count: count() }).from(shows);
  const dataQuery = db.query.shows.findMany({
    limit,
    offset,
    where: finalWhereClause,
    orderBy,
    columns: {
      id: true, slug: true, title: true, description: true, year: true,
      difficulty: true, duration: true, price: true, graphicUrl: true,
      thumbnailUrl: true, featured: true, displayOrder: true, createdAt: true,
    },
    with: {
      files: {
        where: (f: any, { eq: feq, and }: any) => and(feq(f.isPublic, true), feq(f.fileType, 'image')),
        orderBy: [files.displayOrder],
        limit: 1,
      },
      showsToTags: { with: { tag: true } },
      showArrangements: {
        orderBy: (sa: any, { asc }: any) => [asc(sa.orderIndex)],
        with: {
          arrangement: {
            columns: { id: true, title: true, scene: true, durationSeconds: true, sampleScoreUrl: true },
          },
        },
      },
    },
  });

  const [totalResult, rows] = await Promise.all([
    finalWhereClause ? countQuery.where(finalWhereClause) : countQuery,
    dataQuery,
  ]);

  const total = totalResult[0]?.count || 0;

  const data = rows.map((r: any) => {
    const graphicUrl = toPublicUrl(r.graphicUrl);
    const thumbnailUrl = toPublicUrl(r.thumbnailUrl);
    const fallbackUrl = r.files?.[0]?.url ? toPublicUrl(r.files[0].url) : null;
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      year: r.year,
      difficulty: r.difficulty,
      duration: r.duration,
      price: r.price ? Number(r.price) : null,
      thumbnailUrl: graphicUrl || thumbnailUrl || fallbackUrl,
      graphicUrl: graphicUrl || null,
      featured: !!r.featured,
      displayOrder: r.displayOrder ?? 0,
      createdAt: r.createdAt,
      arrangements: (r.showArrangements || []).map((sa: any) => sa.arrangement).filter(Boolean),
      showsToTags: r.showsToTags || [],
    };
  });

  return { data, total };
}

const getCachedShows = unstable_cache(
  queryShowsData,
  ['shows-api'],
  { revalidate: 3600, tags: ['shows'] }
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filterState = FilterUrlManager.fromUrlParams(searchParams);

  const page = filterState.page || 1;
  const limit = filterState.limit || 20;
  const featuredParam = searchParams.get('featured');

  try {
    const { data, total } = await getCachedShows({
      search: filterState.search,
      conditions: filterState.conditions || [],
      sort: filterState.sort || [],
      page,
      limit,
      featured: featuredParam && ['true', '1'].includes(featuredParam.toLowerCase()) ? true : undefined,
    });

    const response = QueryBuilder.buildFilteredResponse(data, total, { ...filterState, limit });
    return SuccessResponse(response);
  } catch (error) {
    console.error('Error fetching shows:', error);
    return SuccessResponse({
      data: [],
      pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
      appliedFilters: filterState,
    });
  }
}

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return UnauthorizedResponse();
  }

  if (!requirePermission(session.user.email, 'canManageShows')) {
    return ForbiddenResponse();
  }

  try {
    const body = await request.json();
    const parsedData = showSchema.safeParse(body);

    if (!parsedData.success) {
      return BadRequestResponse(parsedData.error.errors);
    }

    const { tags: tagIds, ...showData } = parsedData.data as any;

    // Generate slug from title
    const generateSlug = (title: string): string => {
      return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    };

    // Generate a unique slug
    let slug = generateSlug(showData.title);
    let slugSuffix = 1;
    
    // Check if slug already exists and make it unique
    while (true) {
      const { data: existingShow } = await supabase
        .from('shows')
        .select('id')
        .eq('slug', slug)
        .single();
      
      if (!existingShow) break;
      
      // If slug exists, append a number
      slug = `${generateSlug(showData.title)}-${slugSuffix}`;
      slugSuffix++;
    }

    // Map camelCase -> snake_case for Supabase
    const insertPayload: any = {};
    const mapIf = (key: string, value: any) => { if (value !== undefined) insertPayload[key] = value; };
    mapIf('title', showData.title);
    mapIf('slug', slug); // Add the generated slug
    mapIf('year', showData.year);
    mapIf('difficulty', showData.difficulty);
    mapIf('duration', showData.duration);
    mapIf('description', showData.description);
    mapIf('price', showData.price);
    mapIf('thumbnail_url', showData.thumbnailUrl ?? showData.thumbnail_url);
    mapIf('video_url', showData.videoUrl ?? showData.video_url);
    mapIf('composer', showData.composer);
    mapIf('song_title', showData.songTitle ?? showData.song_title);
    mapIf('display_order', showData.displayOrder);

    const { data: inserted, error: insertErr } = await supabase
      .from('shows')
      .insert(insertPayload)
      .select('*')
      .single();

    if (insertErr) {
      console.error('Supabase insert error (shows):', insertErr.message);
      return ErrorResponse('Failed to create show');
    }

    if (Array.isArray(tagIds) && tagIds.length > 0) {
      const rows = tagIds.map((tagId: number) => ({ show_id: inserted!.id, tag_id: tagId }));
      const { error: tagErr } = await supabase.from('shows_to_tags').insert(rows);
      if (tagErr) {
        console.warn('Supabase insert warning (shows_to_tags):', tagErr.message);
        // continue despite tag linking failure
      }
    }

    // @ts-expect-error - revalidateTag expects 1 arg but types mismatch
    revalidateTag('shows');
    return SuccessResponse(inserted, 201);
  } catch (error) {
    console.error('Error creating show (Supabase):', error);
    return ErrorResponse('Failed to create show');
  }
}