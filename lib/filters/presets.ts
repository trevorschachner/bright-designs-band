import { FilterPreset, FilterState } from './types';

/**
 * Pre-defined filter presets for common use cases
 */

// Shows presets
export const SHOWS_PRESETS: FilterPreset[] = [
  {
    id: 'recent',
    name: 'Recent Shows',
    description: 'Shows created in the last year',
    filters: {
      conditions: [
        {
          field: 'createdAt',
          operator: 'gte',
          value: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      sort: [
        { field: 'createdAt', direction: 'desc' }
      ]
    }
  },
  {
    id: 'beginner-friendly',
    name: 'Beginner Friendly',
    description: 'Shows suitable for beginning bands',
    filters: {
      conditions: [
        {
          field: 'difficulty',
          operator: 'equals',
          value: 'Beginner'
        }
      ],
      sort: [
        { field: 'title', direction: 'asc' }
      ]
    }
  },
  {
    id: 'advanced',
    name: 'Advanced Shows',
    description: 'Challenging shows for experienced bands',
    filters: {
      conditions: [
        {
          field: 'difficulty',
          operator: 'equals',
          value: 'Advanced'
        }
      ],
      sort: [
        { field: 'createdAt', direction: 'desc' }
      ]
    }
  },
  {
    id: 'affordable',
    name: 'Budget Friendly',
    description: 'Shows under $500',
    filters: {
      conditions: [
        {
          field: 'price',
          operator: 'lte',
          value: 500
        }
      ],
      sort: [
        { field: 'price', direction: 'asc' }
      ]
    }
  },
  {
    id: 'short-shows',
    name: 'Short Shows',
    description: 'Shows under 6 minutes',
    filters: {
      conditions: [
        {
          field: 'duration',
          operator: 'contains',
          value: ':'
        }
      ],
      sort: [
        { field: 'duration', direction: 'asc' }
      ]
    }
  }
];

// Arrangements presets
export const ARRANGEMENTS_PRESETS: FilterPreset[] = [
  {
    id: 'orchestral',
    name: 'Orchestral Arrangements',
    description: 'Full orchestral arrangements',
    filters: {
      conditions: [
        {
          field: 'type',
          operator: 'contains',
          value: 'orchestral'
        }
      ],
      sort: [
        { field: 'title', direction: 'asc' }
      ]
    }
  },
  {
    id: 'marching-band',
    name: 'Marching Band',
    description: 'Marching band arrangements',
    filters: {
      conditions: [
        {
          field: 'type',
          operator: 'contains',
          value: 'marching'
        }
      ],
      sort: [
        { field: 'title', direction: 'asc' }
      ]
    }
  },
  {
    id: 'affordable-arrangements',
    name: 'Budget Arrangements',
    description: 'Arrangements under $100',
    filters: {
      conditions: [
        {
          field: 'price',
          operator: 'lte',
          value: 100
        }
      ],
      sort: [
        { field: 'price', direction: 'asc' }
      ]
    }
  },
  {
    id: 'premium',
    name: 'Premium Arrangements', 
    description: 'High-end arrangements over $200',
    filters: {
      conditions: [
        {
          field: 'price',
          operator: 'gte',
          value: 200
        }
      ],
      sort: [
        { field: 'price', direction: 'desc' }
      ]
    }
  }
];

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