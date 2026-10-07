import { describe, it, expect } from 'vitest';
import { getTableColumns } from 'drizzle-orm';
import { shows, arrangements } from '@/lib/database/schema';
import { showDifficultyEnum, arrangementSceneEnum } from '@/lib/database/schema';
import { deriveFilterFields } from '../filter-fields';
import { SHOWS_FILTER_FIELDS, SHOWS_ADMIN_FILTER_FIELDS, ARRANGEMENTS_FILTER_FIELDS } from '../filter-definitions';
import type { FilterField } from '../types';

// Filter fields used to restate column names and types by hand, and the
// restatement drifted: `type`, `price` and `showId` sat in the arrangements
// list for nine months after those columns stopped existing, and the UI
// offered all three as filters that 500ed when clicked. Fields are now derived
// from the Drizzle table, so a nonexistent column is a compile error. These
// tests cover what the type system still cannot see.

const byKey = (fields: FilterField[], key: string) =>
  fields.find(f => f.key === key)!;

describe('column fields are derived from the Drizzle table', () => {
  const cases = [
    { name: 'shows', fields: SHOWS_FILTER_FIELDS, table: shows },
    { name: 'shows (admin)', fields: SHOWS_ADMIN_FILTER_FIELDS, table: shows },
    { name: 'arrangements', fields: ARRANGEMENTS_FILTER_FIELDS, table: arrangements },
  ] as const;

  for (const { name, fields, table } of cases) {
    it(`${name}: every scalar field resolves to a real column`, () => {
      const columns = Object.keys(getTableColumns(table));
      const missing = fields
        .filter(f => f.type !== 'relation')
        .map(f => f.key)
        .filter(k => !columns.includes(k));
      expect(missing).toEqual([]);
    });
  }

  // numeric columns report `dataType: 'string'` because Drizzle carries them
  // as strings to avoid float precision loss. Deriving the field type from
  // dataType instead of columnType would quietly turn price into a text filter
  // and strip its range operators.
  it('numeric columns are number fields, not text', () => {
    const price = byKey(SHOWS_ADMIN_FILTER_FIELDS, 'price');
    expect(price.type).toBe('number');
    expect(price.operators).toContain('between');
    expect(price.operators).toContain('gte');
  });

  it('smallint columns are number fields', () => {
    expect(byKey(SHOWS_FILTER_FIELDS, 'year').type).toBe('number');
  });

  it('text columns are text fields', () => {
    expect(byKey(SHOWS_FILTER_FIELDS, 'duration').type).toBe('text');
  });
});

describe('enum members come from the database enum, not a hand-copy', () => {
  it('shows.difficulty tracks showDifficultyEnum', () => {
    const difficulty = byKey(SHOWS_FILTER_FIELDS, 'difficulty');
    expect(difficulty.type).toBe('enum');
    expect(difficulty.enumValues).toEqual([...showDifficultyEnum.enumValues]);
  });

  it('arrangements.scene tracks arrangementSceneEnum', () => {
    const scene = byKey(ARRANGEMENTS_FILTER_FIELDS, 'scene');
    expect(scene.type).toBe('enum');
    expect(scene.enumValues).toEqual([...arrangementSceneEnum.enumValues]);
  });
});

// Relation fields name no column, so the type system cannot check them. They
// work only if the route handling the request hands buildTableQuery a handler
// for the key; anything else reaches the query builder as an unknown field.
const RESOLVED_RELATIONS = ['tags'];

describe('relation filter fields are ones a route can resolve', () => {
  it('shows offers only resolved relations', () => {
    const relations = SHOWS_FILTER_FIELDS.filter(f => f.type === 'relation').map(f => f.key);
    expect(relations).toEqual(RESOLVED_RELATIONS);
  });

  it('arrangements offers only resolved relations', () => {
    const relations = ARRANGEMENTS_FILTER_FIELDS.filter(f => f.type === 'relation').map(f => f.key);
    expect(relations).toEqual(RESOLVED_RELATIONS);
  });
});

describe('deriveFilterFields', () => {
  it('defaults the label and placeholder from the key', () => {
    const [field] = deriveFilterFields(shows, { columns: [{ key: 'displayOrder' }] });
    expect(field.label).toBe('Display Order');
    expect(field.placeholder).toBe('Filter by display order...');
  });

  it('keeps the declared order, columns before relations', () => {
    expect(SHOWS_ADMIN_FILTER_FIELDS.map(f => f.key)).toEqual([
      'title',
      'year',
      'difficulty',
      'displayOrder',
      'duration',
      'price',
      'tags',
    ]);
  });

  // Pricing is quoted per program. A public filter or sort on price would let
  // anyone bracket it from the result set, so it is admin only.
  it('the public shows allowlist has no price', () => {
    expect(SHOWS_FILTER_FIELDS.map(f => f.key)).toEqual([
      'title',
      'year',
      'difficulty',
      'displayOrder',
      'duration',
      'tags',
    ]);
  });

  // The allowlist is data, and this throw is the last thing between a bad
  // entry and a query-time 500. Reachable only by defeating the types.
  it('rejects a key that is not a column on the table', () => {
    expect(() =>
      deriveFilterFields(shows, {
        columns: [{ key: 'notAColumn' as 'title' }],
      }),
    ).toThrow(/not a column/);
  });
});
