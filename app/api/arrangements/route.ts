import { arrangements, showArrangements, arrangementsToTags, shows } from '@/lib/database/schema';
import { NextResponse } from 'next/server';
import { guard } from '@/lib/auth/guard';
import { QueryBuilder } from '@/lib/filters/query-builder';
import { UnknownFilterFieldError } from '@/lib/filters/table-query';
import { eq, desc } from 'drizzle-orm';
import { withDb } from '@/lib/utils/db';
import { PUBLIC_CACHE_HEADERS } from '@/lib/utils/api-helpers';
import { parseArrangementsQuery, queryArrangements } from '@/lib/services/catalog';
import { invalidateArrangement } from '@/lib/services/invalidate';

/**
 * A page of the arrangements catalog via `queryArrangements`, the same read
 * /arrangements renders from. Raw body (no envelope), unchanged:
 * `{ data, pagination, appliedFilters }`. Filters are parsed and bounded by
 * lib/filters/catalog-params.ts.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = parseArrangementsQuery(searchParams);

  try {
    const { rows, total } = await queryArrangements(filters);
    const response = QueryBuilder.buildFilteredResponse(rows, total, filters);
    return NextResponse.json(response, { headers: PUBLIC_CACHE_HEADERS });
  } catch (error) {
    // A filter naming a column the table does not have is the caller's
    // mistake, not a server fault.
    if (error instanceof UnknownFilterFieldError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error fetching arrangements:', error);
    return NextResponse.json({ error: 'Failed to fetch arrangements' }, { status: 500 });
  }
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

    const [parent] = await db
      .select({ slug: shows.slug })
      .from(shows)
      .where(eq(shows.id, Number(showId)))
      .limit(1);
    invalidateArrangement(newId, parent?.slug);
    return NextResponse.json({ id: newId, showId: Number(showId), orderIndex: finalOrder });
  });
}
