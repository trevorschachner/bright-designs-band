import { shows, arrangements } from '@/lib/database/schema';
import { deriveFilterFields } from './filter-fields';
import { FilterField } from './types';

/**
 * Which columns users may filter on, in the order the UI shows them, and how
 * each one is described. Everything else about a field — its type, its
 * operators, an enum's members — is read off the Drizzle table at import time.
 *
 * Adding a filter means adding an entry here. Naming a column that does not
 * exist will not compile.
 */

export const SHOWS_FILTER_FIELDS: FilterField[] = deriveFilterFields(shows, {
  columns: [
    {
      key: 'title',
      description: 'The name of the show',
      placeholder: 'Search by show title...',
    },
    {
      key: 'year',
      description: 'The year the show was created or premiered',
      placeholder: 'Filter by year...',
      min: 1900,
      max: new Date().getFullYear() + 10,
    },
    {
      key: 'difficulty',
      description:
        'The skill level required: Beginner (Grade 1-2), Intermediate (Grade 3-4), or Advanced (Grade 5+)',
      placeholder: 'Select difficulty level...',
    },
    {
      key: 'displayOrder',
      description: 'Custom display order for shows (lower numbers appear first)',
      min: 0,
    },
    {
      key: 'duration',
      description: 'The total duration or length of the show',
      placeholder: 'Filter by duration...',
    },
    {
      key: 'price',
      description: 'The purchase price of the show in USD',
      placeholder: 'Filter by price range...',
      min: 0,
      max: 10000,
    },
  ],
  // `tags` is the only relation either route resolves. `arrangements` was once
  // offered here with no defined meaning ("shows whose arrangements are
  // what?") and reached the query builder as an unknown column.
  relations: [
    {
      key: 'tags',
      description: 'Filter by tags or categories associated with the show',
      placeholder: 'Select tags...',
    },
  ],
});

export const ARRANGEMENTS_FILTER_FIELDS: FilterField[] = deriveFilterFields(arrangements, {
  columns: [
    {
      key: 'title',
      description: 'The name of the arrangement',
      placeholder: 'Search by title...',
    },
    {
      key: 'scene',
      description: 'The scene type (Opener, Ballad, Closer)',
      placeholder: 'Select scene...',
    },
  ],
  relations: [
    {
      key: 'tags',
      description: 'Filter by tags or categories associated with the arrangement',
      placeholder: 'Select tags...',
    },
  ],
});
