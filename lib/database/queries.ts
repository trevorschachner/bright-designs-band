// Database query functions - proper way to use Drizzle
import { db } from './index';
import { shows, arrangements, files, tags, contactSubmissions, showArrangements } from './schema';
import { eq, desc, and, or, ilike, count, innerJoin } from 'drizzle-orm';

// =======================================
// SHOWS QUERIES
// =======================================

export async function getAllShows() {
  try {
    return await db.select().from(shows).orderBy(desc(shows.createdAt));
  } catch (error) {
    console.error('Error fetching shows:', error);
    throw error;
  }
}

export async function getShowById(id: number) {
  try {
    const result = await db
      .select()
      .from(shows)
      .where(eq(shows.id, id))
      .limit(1);
    
    return result[0] || null;
  } catch (error) {
    console.error('Error fetching show by ID:', error);
    throw error;
  }
}

export async function getShowsWithFilters(filters: {
  difficulty?: string;
  searchTerm?: string;
  year?: string;
}) {
  try {
    const conditions = [];

    if (filters.difficulty) {
      conditions.push(eq(shows.difficulty, filters.difficulty as any));
    }

    if (filters.year) {
      conditions.push(eq(shows.year as any, Number(filters.year) as any));
    }

    if (filters.searchTerm) {
      conditions.push(
        or(
          ilike(shows.name, `%${filters.searchTerm}%`),
          ilike(shows.title, `%${filters.searchTerm}%`),
          ilike(shows.description, `%${filters.searchTerm}%`),
          ilike(shows.composer, `%${filters.searchTerm}%`)
        )
      );
    }

    if (conditions.length > 0) {
      return await db
        .select()
        .from(shows)
        .where(and(...conditions))
        .orderBy(desc(shows.createdAt));
    } else {
      return await db
        .select()
        .from(shows)
        .orderBy(desc(shows.createdAt));
    }
  } catch (error) {
    console.error('Error fetching filtered shows:', error);
    throw error;
  }
}

// =======================================
// ARRANGEMENTS QUERIES
// =======================================

export async function getArrangementsByShowId(showId: number) {
  try {
    const result = await db
      .select({
        id: arrangements.id,
        composer: arrangements.composer,
        grade: arrangements.grade,
        year: arrangements.year,
        durationSeconds: arrangements.durationSeconds,
        description: arrangements.description,
        percussionArranger: arrangements.percussionArranger,
        copyrightAmountUsd: arrangements.copyrightAmountUsd,
        ensembleSize: arrangements.ensembleSize,
        youtubeUrl: arrangements.youtubeUrl,
        commissioned: arrangements.commissioned,
        sampleScoreUrl: arrangements.sampleScoreUrl,
        orderIndex: showArrangements.orderIndex,
      })
      .from(showArrangements)
      .innerJoin(arrangements, eq(showArrangements.arrangementId, arrangements.id))
      .where(eq(showArrangements.showId, showId))
      .orderBy(showArrangements.orderIndex);
    return result;
  } catch (error) {
    console.error('Error fetching arrangements:', error);
    throw error;
  }
}

export async function getAllArrangements() {
  try {
    return await db.select().from(arrangements);
  } catch (error) {
    console.error('Error fetching all arrangements:', error);
    throw error;
  }
}

export async function getArrangementById(id: number) {
  try {
    const result = await db
      .select()
      .from(arrangements)
      .where(eq(arrangements.id, id))
      .limit(1);
    
    return result[0] || null;
  } catch (error) {
    console.error('Error fetching arrangement by ID:', error);
    throw error;
  }
}

// =======================================
// FILES QUERIES
// =======================================

export async function getPublicFilesByShowId(showId: number) {
  try {
    return await db
      .select()
      .from(files)
      .where(and(
        eq(files.showId, showId),
        eq(files.isPublic, true)
      ))
      .orderBy(files.displayOrder);
  } catch (error) {
    console.error('Error fetching public files:', error);
    throw error;
  }
}

export async function getFilesByArrangementId(arrangementId: number) {
  try {
    return await db
      .select()
      .from(files)
      .where(and(
        eq(files.arrangementId, arrangementId),
        eq(files.isPublic, true)
      ))
      .orderBy(files.displayOrder);
  } catch (error) {
    console.error('Error fetching arrangement files:', error);
    throw error;
  }
}

// =======================================
// TAGS QUERIES
// =======================================

export async function getAllTags() {
  try {
    return await db.select().from(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
}

// =======================================
// STATISTICS QUERIES
// =======================================

export async function getDashboardStats() {
  try {
    const [showCount] = await db.select({ count: count() }).from(shows);
    const [arrangementCount] = await db.select({ count: count() }).from(arrangements);
    const [contactCount] = await db.select({ count: count() }).from(contactSubmissions);
    const [fileCount] = await db.select({ count: count() }).from(files);

    return {
      totalShows: showCount.count,
      totalArrangements: arrangementCount.count,
      totalContacts: contactCount.count,
      totalFiles: fileCount.count,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

// =======================================
// CONTACT SUBMISSIONS QUERIES
// =======================================

export async function createContactSubmission(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  service: string;
  message: string;
  privacyAgreed: boolean;
  ipAddress?: string;
  userAgent?: string;
  interestedShowId?: number;
  interestedArrangementId?: number;
}) {
  try {
    const result = await db
      .insert(contactSubmissions)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return result[0];
  } catch (error) {
    console.error('Error creating contact submission:', error);
    throw error;
  }
}

export async function getContactSubmissions(limit = 50) {
  try {
    return await db
      .select()
      .from(contactSubmissions)
      .orderBy(desc(contactSubmissions.createdAt))
      .limit(limit);
  } catch (error) {
    console.error('Error fetching contact submissions:', error);
    throw error;
  }
}

export async function updateContactSubmissionStatus(
  id: number, 
  status: string, 
  adminNotes?: string
) {
  try {
    const result = await db
      .update(contactSubmissions)
      .set({
        status,
        adminNotes,
        updatedAt: new Date(),
      })
      .where(eq(contactSubmissions.id, id))
      .returning();
    
    return result[0];
  } catch (error) {
    console.error('Error updating contact submission:', error);
    throw error;
  }
}

// =======================================
// EXAMPLE USAGE IN A NEXT.JS PAGE
// =======================================

// How to use these in a page component:
/*
// app/shows/page.tsx
import { getAllShows } from '@/lib/database/queries';

export default async function ShowsPage() {
  const shows = await getAllShows();
  
  return (
    <div>
      {shows.map(show => (
        <div key={show.id}>
          <h2>{show.title}</h2>
          <p>{show.description}</p>
          <p>Year: {show.year}</p>
          <p>Difficulty: {show.difficulty}</p>
        </div>
      ))}
    </div>
  );
}
*/

// =======================================
// EXAMPLE USAGE IN AN API ROUTE
// =======================================

// How to use these in an API route:
/*
// app/api/shows/route.ts
import { getAllShows } from '@/lib/database/queries';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const shows = await getAllShows();
    return NextResponse.json(shows);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch shows' }, 
      { status: 500 }
    );
  }
}
*/

// =======================================
// EXAMPLE USAGE WITH FILTERS
// =======================================

/*
// app/api/shows/search/route.ts
import { getShowsWithFilters } from '@/lib/database/queries';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const filters = {
    difficulty: searchParams.get('difficulty') || undefined,
    searchTerm: searchParams.get('search') || undefined,
    year: searchParams.get('year') || undefined,
  };
  
  try {
    const shows = await getShowsWithFilters(filters);
    return NextResponse.json(shows);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to search shows' }, 
      { status: 500 }
    );
  }
}
*/
