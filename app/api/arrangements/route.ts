import { arrangements, files, showArrangements, arrangementsToTags } from '@/lib/database/schema';
import { NextResponse } from 'next/server';
import { guard } from '@/lib/auth/guard';
import { revalidateTag } from 'next/cache';
import { QueryBuilder, FilterUrlManager } from '@/lib/filters/query-builder';
import { buildTableQuery, UnknownFilterFieldError } from '@/lib/filters/table-query';
import { count } from 'drizzle-orm/sql';
import { eq, desc, exists, and, inArray } from 'drizzle-orm';
import { withDb } from '@/lib/utils/db';

// Cache API responses for 1 hour, revalidate in background
export const revalidate = 3600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filterState = FilterUrlManager.fromUrlParams(searchParams);

  return withDb(async (db) => {
    try {
      // Default pagination
      const page = filterState.page || 1;
      const limit = filterState.limit || 25;
      const offset = (page - 1) * limit;

      const { where: finalWhereClause, orderBy } = buildTableQuery(
        arrangements,
        filterState,
        {
          // 'name' used to be listed here but arrangements has no such column,
          // so buildSearchCondition silently discarded it.
          searchable: ['title', 'composer', 'arranger'],
          relations: {
            tags: (tagIds) =>
              exists(
                db
                  .select()
                  .from(arrangementsToTags)
                  .where(
                    and(
                      eq(arrangementsToTags.arrangementId, arrangements.id),
                      inArray(arrangementsToTags.tagId, tagIds)
                    )
                  )
              ),
          },
          defaultOrderBy: [arrangements.title],
        }
      );

      let countQueryBuilder = db.select({ count: count() }).from(arrangements);
      if (finalWhereClause) {
        countQueryBuilder = countQueryBuilder.where(finalWhereClause) as typeof countQueryBuilder;
      }

      const countQuery = countQueryBuilder;

      // Execute count query and optimized single query with public files relation (audio/sample score)
      const [totalResult, arrangementsWithRelations] = await Promise.all([
        countQuery,
        db.query.arrangements.findMany({
          limit,
          offset,
          where: finalWhereClause,
          orderBy,
          // Explicit columns: never ship copyright cost or other internal
          // fields on a public, edge-cached route.
          columns: {
            id: true,
            title: true,
            composer: true,
            arranger: true,
            percussionArranger: true,
            description: true,
            grade: true,
            year: true,
            durationSeconds: true,
            scene: true,
            ensembleSize: true,
            youtubeUrl: true,
            commissioned: true,
            sampleScoreUrl: true,
            displayOrder: true,
          },
          with: {
            files: {
              where: (files: any, { eq }: any) => eq(files.isPublic, true),
              orderBy: [files.displayOrder, files.createdAt],
            },
            showArrangements: {
              with: {
                show: {
                  columns: {
                    id: true,
                    title: true,
                    slug: true,
                  },
                },
              },
            },
          },
        })
      ]);

      const total = totalResult[0]?.count || 0;

      // Ensure the response pagination reflects the actual limit used (25) even if not in URL
      const activeFilterState = { ...filterState, limit };

      const response = QueryBuilder.buildFilteredResponse(
        arrangementsWithRelations,
        total,
        activeFilterState
      );

      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          // Without this the edge caches one body per path: a search for
          // something with no matches was served to every visitor as an empty
          // catalogue until the hour expired. See lib/utils/api-helpers.ts.
          'Netlify-Vary': 'query',
        },
      });
    } catch (error) {
      // A filter naming a column the table does not have is the caller's
      // mistake, not a server fault. It used to land in the 500 below, which is
      // how the dead `type` and `price` filters presented.
      if (error instanceof UnknownFilterFieldError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      console.error('Error fetching arrangements:', error);
      return NextResponse.json(
        { error: 'Failed to fetch arrangements' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: Request) {
  const gate = await guard('canCreateArrangements');
  if (gate.denied) return gate.denied;

  const body = await request.json();
  const { showId, displayOrder, tags: tagIds, ...rest } = body as any;
  
  console.log('POST /api/arrangements', { showId, displayOrder, typeOfDisplayOrder: typeof displayOrder });

  if (!showId) {
    return NextResponse.json({ error: 'showId is required' }, { status: 400 });
  }

  return withDb(async (db) => {
    // Compute order index from join table (max + 1)
    let finalOrder: number;
    if (typeof displayOrder === 'number') {
      finalOrder = displayOrder;
    } else {
      const existing = await db
        .select({ orderIndex: showArrangements.orderIndex })
        .from(showArrangements)
        .where(eq(showArrangements.showId, Number(showId)))
        .orderBy(desc(showArrangements.orderIndex))
        .limit(1);
      finalOrder = ((existing[0]?.orderIndex as number | undefined) ?? -1) + 1;
    }

    // Prepare arrangement data - convert to Drizzle schema format (camelCase)
    const arrangementData: any = {};
    if (rest.title !== undefined) arrangementData.title = rest.title;
    if (rest.composer !== undefined) arrangementData.composer = rest.composer;
    if (rest.arranger !== undefined) arrangementData.arranger = rest.arranger;
    if (rest.percussionArranger !== undefined) arrangementData.percussionArranger = rest.percussionArranger;
    if (rest.description !== undefined) arrangementData.description = rest.description;
    if (rest.grade !== undefined) arrangementData.grade = rest.grade;
    if (rest.year !== undefined) arrangementData.year = rest.year ? Number(rest.year) : null;
    if (rest.durationSeconds !== undefined) arrangementData.durationSeconds = rest.durationSeconds ? Number(rest.durationSeconds) : null;
    if (rest.scene !== undefined) arrangementData.scene = rest.scene;
    if (rest.ensembleSize !== undefined) arrangementData.ensembleSize = rest.ensembleSize;
    if (rest.youtubeUrl !== undefined) arrangementData.youtubeUrl = rest.youtubeUrl;
    if (rest.commissioned !== undefined) arrangementData.commissioned = rest.commissioned;
    if (rest.sampleScoreUrl !== undefined) arrangementData.sampleScoreUrl = rest.sampleScoreUrl;
    // Use the destructured displayOrder, not rest.displayOrder (which is undefined)
    if (displayOrder !== undefined) arrangementData.displayOrder = displayOrder ? Number(displayOrder) : 0;

    // Create arrangement (no direct FK on arrangements table anymore)
    const inserted = await db.insert(arrangements).values(arrangementData).returning({ id: arrangements.id });
    const newId = inserted[0]?.id;
    if (!newId) {
      return NextResponse.json({ error: 'Failed to create arrangement' }, { status: 500 });
    }

    // Link to show via join table with computed order
    await db.insert(showArrangements).values({
      showId: Number(showId),
      arrangementId: newId,
      orderIndex: finalOrder,
    });

    // Insert tags if provided
    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      await db.insert(arrangementsToTags).values(
        tagIds.map((tagId: number) => ({
          arrangementId: newId,
          tagId,
        }))
      );
    }

    // @ts-expect-error - revalidateTag expects 1 arg but types mismatch
    revalidateTag('arrangements');
    return NextResponse.json({ id: newId, showId: Number(showId), orderIndex: finalOrder });
  });
}
