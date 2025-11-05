import { createClient as createServerClient } from '@/lib/utils/supabase/server';
import { NextResponse } from 'next/server';
import { FilterUrlManager } from '@/lib/filters/query-builder';
import { requirePermission } from '@/lib/auth/roles';
import { showSchema } from '@/lib/validation/shows';
import { SuccessResponse, ErrorResponse, UnauthorizedResponse, ForbiddenResponse, BadRequestResponse } from '@/lib/utils/api-helpers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filterState = FilterUrlManager.fromUrlParams(searchParams);
  try {
    const supabase = await createServerClient();

    const page = filterState.page || 1;
    const limit = filterState.limit || 20;
    const offset = (page - 1) * limit;

    // Build base query selecting only needed columns
    let base = supabase
      .from('shows')
      .select('id,title,description,year,difficulty,duration,thumbnail_url,created_at', { count: 'exact', head: false });

    // Search across a few text columns
    if (filterState.search) {
      const term = String(filterState.search);
      base = base.or(
        `title.ilike.%${term}%,description.ilike.%${term}%`
      );
    }

    // Simple field filters
    for (const cond of filterState.conditions || []) {
      const field = String(cond.field);
      const value = cond.value as any;
      if (field === 'year' && value) base = base.eq('year', String(value));
      if (field === 'difficulty' && value) base = base.eq('difficulty', String(value));
      // Additional fields can be added here as needed
    }

    // Sorting
    if (filterState.sort && filterState.sort.length > 0) {
      const first = filterState.sort[0];
      base = base.order(first.field, { ascending: first.direction === 'asc' });
    } else {
      base = base.order('created_at', { ascending: false });
    }

    // Pagination
    base = base.range(offset, offset + limit - 1);

    const { data: rows, error, count } = await base;
    if (error) throw error;

    const showIds = Array.isArray(rows) ? rows.map(r => r.id) : [];

    // Fetch tags relation and group by show
    let tagsByShowId: Record<number, any[]> = {};
    if (showIds.length > 0) {
      const { data: tagRows, error: tagErr } = await supabase
        .from('shows_to_tags')
        .select('show_id,tags(id,name)')
        .in('show_id', showIds);
      if (tagErr) {
        // Non-fatal: continue without tags
        console.warn('Failed to fetch show tags:', tagErr.message);
      } else if (Array.isArray(tagRows)) {
        tagsByShowId = tagRows.reduce((acc: Record<number, any[]>, row: any) => {
          const tag = row?.tags;
          if (!acc[row.show_id]) acc[row.show_id] = [];
          if (tag) acc[row.show_id].push({ tag });
          return acc;
        }, {} as Record<number, any[]>);
      }
    }

    // Map snake_case -> camelCase + attach tags
    const normalized = (rows || []).map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      year: r.year,
      difficulty: r.difficulty,
      duration: r.duration,
      thumbnailUrl: r.thumbnail_url || null,
      createdAt: r.created_at,
      showsToTags: tagsByShowId[r.id] || [],
    }));

    const total = typeof count === 'number' ? count : normalized.length;
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

    const response = {
      data: normalized,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      appliedFilters: filterState,
    };

    return SuccessResponse(response);
  } catch (error) {
    console.error('Error fetching shows (Supabase):', error);
    // Graceful fallback: return empty result so UI can render without hard fail
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

    // Map camelCase -> snake_case for Supabase
    const insertPayload: any = {};
    const mapIf = (key: string, value: any) => { if (value !== undefined) insertPayload[key] = value; };
    mapIf('title', showData.title ?? showData.name);
    mapIf('year', showData.year);
    mapIf('difficulty', showData.difficulty);
    mapIf('duration', showData.duration);
    mapIf('description', showData.description);
    mapIf('price', showData.price);
    mapIf('thumbnail_url', showData.thumbnailUrl ?? showData.thumbnail_url);
    mapIf('video_url', showData.videoUrl ?? showData.video_url);
    mapIf('composer', showData.composer);
    mapIf('song_title', showData.songTitle ?? showData.song_title);

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