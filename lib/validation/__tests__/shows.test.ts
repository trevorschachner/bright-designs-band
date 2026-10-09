import { describe, it, expect } from 'vitest';
import { getTableColumns } from 'drizzle-orm';
import { shows } from '@/lib/database/schema';
import { showSchema, updateShowActionSchema as updateShowSchema } from '../shows';

// showSchema used to be hand-written and had drifted: it declared seven
// columns that do not exist on `shows` and omitted nine that do. It is now
// generated from the Drizzle table, so a key naming a nonexistent column is a
// compile error. These tests cover what the type system cannot see.

const parse = (input: Record<string, unknown>) => showSchema.safeParse({ title: 'A Show', ...input });

describe('showSchema is generated from the shows table', () => {
  it('accepts only keys that are real columns', () => {
    const columns = Object.keys(getTableColumns(shows));
    const keys = Object.keys((showSchema as unknown as { shape: Record<string, unknown> }).shape)
      .filter(k => k !== 'tags'); // tags is a relation, not a column
    expect(keys.filter(k => !columns.includes(k))).toEqual([]);
  });

  // The exact seven that sat in the schema for nine months. Zod strips unknown
  // keys rather than rejecting them, so the guarantee is that they never reach
  // the parsed output and therefore never reach an insert.
  const PHANTOM = ['quantity', 'instrumentation', 'composer', 'arranger', 'lyricist', 'songTitle', 'bpm'];

  it.each(PHANTOM)('drops the phantom field %s', field => {
    const result = parse({ [field]: 'anything' });
    expect(result.success).toBe(true);
    expect(result.success && field in result.data).toBe(false);
  });
});

// Shows are created narrow and enriched by editing. These columns exist and
// are writable via PUT, but POST must not accept them until the new-show form
// actually sends them -- otherwise the schema claims a capability the UI has
// no way to exercise.
describe('create stays narrow', () => {
  const EDIT_ONLY = [
    'commissioned', 'programCoordinator', 'percussionArranger',
    'soundDesigner', 'windArranger', 'drillWriter',
    'featured', 'graphicUrl', 'youtubeUrl', 'slug',
  ];

  it.each(EDIT_ONLY)('does not accept %s at create time', field => {
    const result = parse({ [field]: field === 'featured' ? true : 'value' });
    expect(result.success).toBe(true);
    expect(result.success && field in result.data).toBe(false);
  });
});

describe('titles are trimmed on the way in', () => {
  it('strips surrounding whitespace', () => {
    const result = parse({ title: '  True Colors  ' });
    expect(result.success && result.data.title).toBe('True Colors');
  });

  it('rejects a title that is only whitespace', () => {
    expect(parse({ title: '   ' }).success).toBe(false);
  });

  it('trims the other free-text fields', () => {
    const result = parse({ description: '  desc  ', duration: '  8:30  ' });
    expect(result.success && result.data.description).toBe('desc');
    expect(result.success && result.data.duration).toBe('8:30');
  });
});

// price is a Postgres numeric, which Drizzle carries as a string. The
// hand-written schema declared z.number(), so existing callers send numbers.
// Both forms are accepted and normalised to what the column wants.
describe('price accepts both wire forms', () => {
  it.each([
    [12.5, '12.5'],
    ['12.50', '12.50'],
  ])('normalises %p to %p', (input, expected) => {
    const result = parse({ price: input });
    expect(result.success && result.data.price).toBe(expected);
  });

  it('treats an absent price as null', () => {
    const result = parse({});
    expect(result.success && result.data.price).toBeNull();
  });
});

describe('column constraints come from the table', () => {
  it('enforces the difficulty enum', () => {
    expect(parse({ difficulty: 'Nope' }).success).toBe(false);
    expect(parse({ difficulty: 'Beginner' }).success).toBe(true);
  });

  it('requires a title', () => {
    expect(showSchema.safeParse({}).success).toBe(false);
  });

  it('accepts the tags relation', () => {
    const result = parse({ tags: [1, 2] });
    expect(result.success && result.data.tags).toEqual([1, 2]);
  });
});

describe('program notes, ensemble size and includes', () => {
  const base = { id: 1, updatedAt: '2026-10-09T00:00:00.000Z', slug: 'apex' };

  it('accepts programNotes, ensembleSize and includes on update', () => {
    const parsed = updateShowSchema.parse({
      ...base,
      programNotes: 'A wolf-pack show.\n\n- Part 1: Hungry Like the Wolf',
      ensembleSize: 'medium',
      includes: 'winds, percussion, sound design',
    });
    expect(parsed.programNotes).toContain('wolf');
    expect(parsed.ensembleSize).toBe('medium');
    expect(parsed.includes).toBe('winds, percussion, sound design');
  });

  it('rejects an includes value outside the vocabulary', () => {
    expect(() => updateShowSchema.parse({ ...base, includes: 'winds, kazoo' })).toThrow();
  });

  it('reads an empty ensembleSize select as no size', () => {
    expect(updateShowSchema.parse({ ...base, ensembleSize: '' }).ensembleSize).toBeNull();
  });

  it('accepts programNotes at create time', () => {
    const result = parse({ programNotes: 'Notes' });
    expect(result.success && result.data.programNotes).toBe('Notes');
  });
});
