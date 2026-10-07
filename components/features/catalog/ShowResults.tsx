'use client';

import { useEffect, useState } from 'react';
import { Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShowCard, type ShowCardItem } from '@/components/features/shows/ShowCard';
import { ShowListView } from '@/components/features/shows/ShowListView';

const VIEW_MODE_KEY = 'showsViewMode';
type ViewMode = 'grid' | 'list';

function readViewMode(): ViewMode | null {
  try {
    const saved = localStorage.getItem(VIEW_MODE_KEY);
    return saved === 'grid' || saved === 'list' ? saved : null;
  } catch {
    return null;
  }
}

/**
 * The show grid (or list) for one server-rendered page of results. The only
 * client state is the grid/list preference, kept in localStorage as before;
 * the server renders the grid, so the HTML always carries every show link.
 */
export function ShowResults({ items, prioritizeFirst }: { items: ShowCardItem[]; prioritizeFirst: boolean }) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    const saved = readViewMode();
    if (saved) setViewMode(saved);
  }, []);

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {
      // Storage blocked (private mode): the choice lasts for this page only.
    }
  };

  return (
    <>
      {/* Compact view toggle */}
      <div className="flex items-center justify-end mb-4">
        <div className="inline-flex items-center gap-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            className="h-8 px-2"
            aria-label="Grid view"
            onClick={() => changeViewMode('grid')}
          >
            <Grid className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            className="h-8 px-2"
            aria-label="List view"
            onClick={() => changeViewMode('list')}
          >
            <List className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {items.map((item, index) => (
            <ShowCard key={item.id} item={item} priority={prioritizeFirst && index === 0} />
          ))}
        </div>
      ) : (
        <div className="space-y-6 mb-8">
          {items.map((item, index) => (
            <ShowListView key={item.id} item={item} priority={prioritizeFirst && index === 0} />
          ))}
        </div>
      )}
    </>
  );
}
