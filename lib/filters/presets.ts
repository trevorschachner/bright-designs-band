import { FilterPreset, FilterState } from './types';

/**
 * Pre-defined filter presets for common use cases
 */

// Shows presets
export const SHOWS_PRESETS: FilterPreset[] = [];

// Arrangements presets
// Emptied for the same reason SHOWS_PRESETS is empty: nothing renders these
// (only SHOWS_PRESETS is passed to a FilterBar), and all four presets filtered
// or sorted on `type` and `price`, neither of which is a column on
// arrangements. Applying one would have thrown in QueryBuilder and surfaced as
// a 500. Rebuild from ARRANGEMENTS_FILTER_FIELDS if presets are wanted.
export const ARRANGEMENTS_PRESETS: FilterPreset[] = [];

/**
 * Get presets for a specific entity type
 */
export function getPresetsForEntity(entity: 'shows' | 'arrangements'): FilterPreset[] {
  switch (entity) {
    case 'shows':
      return SHOWS_PRESETS;
    case 'arrangements':
      return ARRANGEMENTS_PRESETS;
    default:
      return [];
  }
}

/**
 * Find a preset by ID
 */
export function findPreset(entity: 'shows' | 'arrangements', presetId: string): FilterPreset | undefined {
  const presets = getPresetsForEntity(entity);
  return presets.find(preset => preset.id === presetId);
}