import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, History } from 'lucide-react';
import type { AttentionGroup, RecentEdit } from '@/lib/services/admin';

const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/New_York' });

function formatWhen(iso: string): string {
  const time = Date.parse(iso);
  return Number.isNaN(time) ? '' : dateFormat.format(time);
}

/** "Recently edited": the last shows and arrangements saved, each linking to its editor. */
export function RecentEditsCard({ edits }: { edits: RecentEdit[] | null }) {
  return (
    <Card className="frame-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Recently edited</CardTitle>
        <History className="h-4 w-4 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent>
        {edits === null ? (
          <p className="text-sm text-muted-foreground">Could not load recent edits. Reload to try again.</p>
        ) : edits.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing edited yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {edits.map((edit) => (
              <li key={`${edit.kind}-${edit.id}`} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <Badge variant="outline" className="shrink-0 capitalize">{edit.kind}</Badge>
                  <Link href={edit.href} className="truncate hover:underline">{edit.title}</Link>
                </span>
                <time dateTime={edit.updatedAt} className="shrink-0 text-xs text-muted-foreground">
                  {formatWhen(edit.updatedAt)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** "Needs attention": the four gap lists, each with its count and links to fix them. */
export function NeedsAttentionCard({ groups }: { groups: AttentionGroup[] | null }) {
  return (
    <Card className="frame-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Needs attention</CardTitle>
        <AlertTriangle className="h-4 w-4 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent className="space-y-4">
        {groups === null ? (
          <p className="text-sm text-muted-foreground">Could not load the checks. Reload to try again.</p>
        ) : (
          groups.map((g) => (
            <section key={g.key} aria-label={g.label}>
              <h3 className="flex items-center justify-between text-sm font-medium">
                <span>{g.label}</span>
                <Badge variant={g.count > 0 ? 'destructive' : 'secondary'}>{g.count}</Badge>
              </h3>
              {g.count === 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">All clear.</p>
              ) : (
                <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                  {g.items.map((item) => (
                    <li key={item.id}>
                      <Link href={item.href} className="text-muted-foreground hover:text-foreground hover:underline">
                        {item.title}
                      </Link>
                    </li>
                  ))}
                  {g.count > g.items.length && (
                    <li className="text-xs text-muted-foreground">and {g.count - g.items.length} more</li>
                  )}
                </ul>
              )}
            </section>
          ))
        )}
      </CardContent>
    </Card>
  );
}
