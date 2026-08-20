import { describe, it, expect } from 'vitest';
import { getTableColumns } from 'drizzle-orm';
import { shows, arrangements } from '@/lib/database/schema';
import {
  SHOWS_SCHEMA,
  ARRANGEMENTS_SCHEMA,
  SHOWS_FILTER_FIELDS,
  ARRANGEMENTS_FILTER_FIELDS,
} from '../schema-analyzer';

// QueryBuilder.buildWhereClause and buildOrderByClause look each condition's
// field up on the Drizzle table object and throw "Column <field> not found in
// table" when it is absent. Both API routes let that throw escape as a 500, so
// any scalar filter field naming a column Drizzle does not know about is a
// filter the UI offers and the server rejects.
describe('filter schemas match the Drizzle tables they filter', () => {
  const cases = [
    { name: 'shows', schema: SHOWS_SCHEMA, table: shows },
    { name: 'arrangements', schema: ARRANGEMENTS_SCHEMA, table: arrangements },
  ] as const;

  for (const { name, schema, table } of cases) {
    it(`${name}: every declared field is a real column`, () => {
      const columns = Object.keys(getTableColumns(table));
      const missing = Object.keys(schema.fields).filter(k => !columns.includes(k));
      expect(missing).toEqual([]);
    });
  }

  const scalarKeys = (fields: { key: string; type: string }[]) =>
    fields.filter(f => f.type !== 'relation').map(f => f.key);

  it('shows: every generated scalar filter field resolves on the table', () => {
    const columns = Object.keys(getTableColumns(shows));
    expect(scalarKeys(SHOWS_FILTER_FIELDS).filter(k => !columns.includes(k))).toEqual([]);
  });

  it('arrangements: every generated scalar filter field resolves on the table', () => {
    const columns = Object.keys(getTableColumns(arrangements));
    expect(scalarKeys(ARRANGEMENTS_FILTER_FIELDS).filter(k => !columns.includes(k))).toEqual([]);
  });
});
