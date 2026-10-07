'use client';

import { useSyncExternalStore } from 'react';
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

// The preference as an external store: localStorage, or memory when storage
// is blocked (private mode), so the choice still applies until reload.
let unsavedViewMode: ViewMode | null = null;
const viewModeListeners = new Set<() => void>();

function subscribeViewMode(onChange: () => void) {
  viewModeListeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    viewModeListeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

const getViewMode = (): ViewMode => unsavedViewMode ?? readViewMode() ?? 'grid';

function saveViewMode(mode: ViewMode) {
  try {
    localStorage.setItem(VIEW_MODE_KEY, mode);
    unsavedViewMode = null;
  } catch {
    unsavedViewMode = mode;
  }
  viewModeListeners.forEach((listener) => listener());
}

/**
 * The show grid (or list) for one server-rendered page of results. The only
 * client state is the grid/list preference, kept in localStorage as before;
 * the server renders the grid, so the HTML always carries every show link.
 */
export function ShowResults({ items, prioritizeFirst }: { items: ShowCardItem[]; prioritizeFirst: boolean }) {
  // The server renders the grid; the saved choice applies after hydration.
  const viewMode = useSyncExternalStore(subscribeViewMode, getViewMode, () => 'grid' as const);
  const changeViewMode = saveViewMode;

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
