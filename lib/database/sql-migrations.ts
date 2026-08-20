import { createHash } from 'crypto'

/**
 * Planning logic for the hand-written SQL migration track in
 * `drizzle/migrations/`.
 *
 * That directory accumulated thirteen files that nothing ever executed:
 * `npm run db:migrate` runs `drizzle-kit migrate`, which only reads drizzle's
 * own journal. One of those unapplied files added `contact_submissions.source`
 * while the application had already started writing that column, so every
 * contact submission insert failed for eight months behind a swallowed error.
 *
 * Kept pure so the ordering, filtering and drift rules are testable.
 */

export type AppliedMigration = { name: string; checksum: string }

export const checksum = (contents: string): string =>
  createHash('sha256').update(contents).digest('hex')

/** Migration files to consider, in apply order. */
export function selectMigrationFiles(fileNames: string[]): string[] {
  return fileNames
    .filter((name) => name.endsWith('.sql') && !name.endsWith('.rollback.sql'))
    .sort()
}

/**
 * Split the tracked files into what still needs applying and what has changed
 * since it was applied. Drift is reported rather than re-applied: once the
 * database has run a statement, editing the file means the two disagree and
 * only a human can say which is right.
 */
export function pendingMigrations(
  fileNames: string[],
  applied: AppliedMigration[],
  contentsByName: Record<string, string>
): { pending: string[]; drifted: string[] } {
  const appliedByName = new Map(applied.map((a) => [a.name, a.checksum]))
  const pending: string[] = []
  const drifted: string[] = []

  for (const name of fileNames) {
    const previous = appliedByName.get(name)
    if (previous === undefined) {
      pending.push(name)
    } else if (previous !== checksum(contentsByName[name] ?? '')) {
      drifted.push(name)
    }
  }
  return { pending, drifted }
}
