import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { EditableShow } from '@/lib/services/admin';
import type { TagOption } from './ShowFields';

const CREDITS: { key: keyof EditableShow; label: string }[] = [
  { key: 'commissioned', label: 'Commissioned' },
  { key: 'programCoordinator', label: 'Program Coordinator' },
  { key: 'percussionArranger', label: 'Percussion Arranger' },
  { key: 'soundDesigner', label: 'Sound Designer' },
  { key: 'windArranger', label: 'Winds Arranger' },
  { key: 'drillWriter', label: 'Drill Writer' },
];

function Item({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={wide ? 'md:col-span-2' : undefined}>
      <div className="text-sm font-medium text-muted-foreground mb-1">{label}</div>
      <div className="text-base">{children}</div>
    </div>
  );
}

/** The saved show, read-only (what the public site has). Re-rendered after each save. */
export function ShowSummaryCard({ show, allTags, partCount }: { show: EditableShow; allTags: TagOption[]; partCount: number }) {
  const tags = allTags.filter((tag) => show.tagIds.includes(tag.id));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Show Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Item label="Title">{show.title || '—'}</Item>
          <Item label="Year">{show.year || '—'}</Item>
          <Item label="Difficulty">{show.difficulty ? <Badge variant="outline">{show.difficulty}</Badge> : '—'}</Item>
          <Item label="Duration">{show.duration || '—'}</Item>
          {show.description && <Item label="Description" wide>{show.description}</Item>}
          {show.thumbnailUrl && (
            <Item label="Thumbnail URL" wide>
              <span className="break-all text-sm">{show.thumbnailUrl}</span>
              <div className="mt-2 relative w-40 aspect-video rounded-md overflow-hidden border">
                {/* Free-text URL: the host may not be in remotePatterns, so unoptimized. */}
                <Image src={show.thumbnailUrl} alt="Thumbnail preview" fill className="object-cover" sizes="160px" unoptimized />
              </div>
            </Item>
          )}
          {show.youtubeUrl && <Item label="YouTube URL" wide><span className="break-all text-sm">{show.youtubeUrl}</span></Item>}
          {CREDITS.map(({ key, label }) => (show[key] ? <Item key={key} label={label}>{String(show[key])}</Item> : null))}
          {tags.length > 0 && (
            <Item label="Tags" wide>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
                ))}
              </div>
            </Item>
          )}
          {partCount > 0 && <Item label="Arrangements" wide>{partCount} arrangement{partCount !== 1 ? 's' : ''}</Item>}
        </div>
      </CardContent>
    </Card>
  );
}
