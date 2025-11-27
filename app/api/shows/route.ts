import { shows, showArrangements, showsToTags, files } from '@/lib/database/schema';
import { NextResponse } from 'next/server';
import { QueryBuilder, FilterUrlManager } from '@/lib/filters/query-builder';
import { count } from 'drizzle-orm/sql';
import { eq, desc } from 'drizzle-orm';
import { createClient as createServerClient } from '@/lib/utils/supabase/server';
import { requirePermission } from '@/lib/auth/roles';
import { showSchema } from '@/lib/validation/shows';
import { SuccessResponse, ErrorResponse, UnauthorizedResponse, ForbiddenResponse, BadRequestResponse } from '@/lib/utils/api-helpers';
import { fileStorage, STORAGE_BUCKET, withRootPrefix } from '@/lib/storage';

export async function GET(request: Request) {
  try {
    // Lazy import DB to avoid requiring DATABASE_URL at module-eval time
    let db: any;
    try {
      ({ db } = await import('@/lib/database'));
    } catch (e) {
      console.error('Database import failed (likely no DATABASE_URL).', e);
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const filterState = FilterUrlManager.fromUrlParams(searchParams);

    // Default pagination
    const page = filterState.page || 1;
    const limit = filterState.limit || 20;
    const offset = (page - 1) * limit;

    // Build base query
    let queryBuilder = db.select().from(shows);
    let countQueryBuilder = db.select({ count: count() }).from(shows);

    // Add WHERE conditions
    const whereConditions = [];

    // Add search condition (title and description)
    if (filterState.search) {
      const searchCondition = QueryBuilder.buildSearchCondition(
        shows,
        filterState.search,
        ['title', 'description']
      );
      if (searchCondition) {
        whereConditions.push(searchCondition);
      }
    }

    // Add filter conditions
    if (filterState.conditions.length > 0) {
      const filterCondition = QueryBuilder.buildWhereClause(shows, filterState.conditions);
      if (filterCondition) {
        whereConditions.push(filterCondition);
      }
    }

    // Legacy featured param support
    const featuredParam = searchParams.get('featured');
    if (featuredParam && ['true', '1'].includes(featuredParam.toLowerCase())) {
      whereConditions.push(eq(shows.featured, true));
    }

    // Build final WHERE clause
    let finalWhereClause;
    if (whereConditions.length > 0) {
      // If we have multiple conditions, combine them with AND
      // Note: QueryBuilder.buildWhereClause already returns an AND combination if multiple conditions are passed to it
      // But here we are collecting separate chunks of conditions (search, filters, legacy params)
      const { and } = await import('drizzle-orm');
      finalWhereClause = whereConditions.length === 1 
        ? whereConditions[0] 
        : and(...whereConditions);
      
      if (finalWhereClause) {
        queryBuilder = queryBuilder.where(finalWhereClause) as typeof queryBuilder;
        countQueryBuilder = countQueryBuilder.where(finalWhereClause) as typeof countQueryBuilder;
      }
    }

    // Add ORDER BY
    if (filterState.sort.length > 0) {
      const orderByClause = QueryBuilder.buildOrderByClause(shows, filterState.sort);
      queryBuilder = queryBuilder.orderBy(...orderByClause) as typeof queryBuilder;
    } else {
      // Default: display_order ASC, then created_at DESC
      queryBuilder = queryBuilder.orderBy(shows.displayOrder, desc(shows.createdAt)) as typeof queryBuilder;
    }

    // Execute count query and optimized single query with relations
    const [totalResult, showsWithRelations] = await Promise.all([
      countQueryBuilder,
      db.query.shows.findMany({
        limit,
        offset,
        where: finalWhereClause,
        orderBy: filterState.sort?.length > 0
          ? QueryBuilder.buildOrderByClause(shows, filterState.sort)
          : [shows.displayOrder, desc(shows.createdAt)],
        with: {
          files: {
            where: (files: any, { eq, and }: any) => and(eq(files.isPublic, true), eq(files.fileType, 'image')),
            orderBy: [files.displayOrder],
            limit: 1, // Only need the first image for fallback
          },
          showsToTags: {
            with: {
              tag: true,
            },
          },
          showArrangements: {
            orderBy: (showArrangements: any, { asc }: any) => [asc(showArrangements.orderIndex)],
            with: {
              arrangement: {
                columns: {
                  id: true,
                  title: true,
                  scene: true,
                  durationSeconds: true,
                  sampleScoreUrl: true,
                },
              },
            },
          },
        },
      })
    ]);

    const total = totalResult[0]?.count || 0;

    // Helper to convert storage paths to public URLs
    // Note: We need a Supabase client for this utility function
    const supabase = await createServerClient();
    const convertToPublicUrl = (urlOrPath: string | null | undefined): string | null => {
      if (!urlOrPath) return null;
      if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
        return urlOrPath;
      }
      try {
        const { data: { publicUrl } } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(withRootPrefix(urlOrPath));
        return publicUrl;
      } catch (error) {
        return null;
      }
    };

    // Normalize and format response
    const normalized = showsWithRelations.map((r: any) => {
      // Determine image URL: graphic_url > thumbnail_url > show image file > null
      const graphicUrl = convertToPublicUrl(r.graphicUrl);
      const thumbnailUrl = convertToPublicUrl(r.thumbnailUrl);
      const fallbackImageUrl = r.files?.[0]?.url ? convertToPublicUrl(r.files[0].url) : null;
      const finalThumbnailUrl = graphicUrl || thumbnailUrl || fallbackImageUrl;

      return {
        id: r.id,
        slug: r.slug,
        title: r.title,
        description: r.description,
        year: r.year,
        difficulty: r.difficulty,
        duration: r.duration,
        price: r.price ? Number(r.price) : null,
        thumbnailUrl: finalThumbnailUrl,
        graphicUrl: graphicUrl || null,
        featured: !!r.featured,
        displayOrder: r.displayOrder ?? 0,
        createdAt: r.createdAt,
        // Flatten nested relations
        arrangements: (r.showArrangements || [])
          .map((sa: any) => sa.arrangement)
          .filter(Boolean),
        showsToTags: (r.showsToTags || []),
      };
    });

    const activeFilterState = { ...filterState, limit };
    const response = QueryBuilder.buildFilteredResponse(
      normalized,
      total,
      activeFilterState
    );

    return SuccessResponse(response);

  } catch (error) {
    console.error('Error fetching shows:', error);
    // Graceful fallback
    const emptyResponse = {
      data: [],
      pagination: {
        page: filterState.page || 1,
        limit: filterState.limit || 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
      appliedFilters: filterState,
    };
    return SuccessResponse(emptyResponse);
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

    return SuccessResponse(inserted, 201);
  } catch (error) {
    console.error('Error creating show (Supabase):', error);
    return ErrorResponse('Failed to create show');
  }
}