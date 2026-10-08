/** Admin dashboard reads. Uncached; throws on a database failure. */

import { db } from '@/lib/database';
import { shows, arrangements, files, tags, contactSubmissions } from '@/lib/database/schema';
import { count } from 'drizzle-orm';

export async function getDashboardStats() {
  const [[showCount], [arrangementCount], [contactCount], [fileCount], [tagCount]] = await Promise.all([
    db.select({ count: count() }).from(shows),
    db.select({ count: count() }).from(arrangements),
    db.select({ count: count() }).from(contactSubmissions),
    db.select({ count: count() }).from(files),
    db.select({ count: count() }).from(tags),
  ]);

  return {
    totalShows: showCount.count,
    totalArrangements: arrangementCount.count,
    totalContacts: contactCount.count,
    totalFiles: fileCount.count,
    totalTags: tagCount.count,
  };
}
