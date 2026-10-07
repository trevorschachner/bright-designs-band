/** Path part of an endpoint, with any query string or hash removed. */
const pathOf = (endpoint: string): string => endpoint.split(/[?#]/)[0].replace(/\/+$/, '');

export function buildDeleteUrl(endpoint: string, id: number | string): string {
  return `${pathOf(endpoint)}/${encodeURIComponent(String(id))}`;
}

export type TableSort = { field: string; direction: 'asc' | 'desc' };

/**
 * List URL: endpoint plus optional fixed query (e.g. "all=true") plus paging,
 * plus sort in the filter system's `sort=[...]` format. Sorting adds `id` as a
 * tiebreaker so rows that share a value (e.g. Order 0) keep a stable order and
 * don't repeat or vanish between pages.
 */
export function buildListUrl(
  endpoint: string,
  listQuery: string | undefined,
  page: number,
  limit: number,
  sort?: TableSort | null,
): string {
  const base = listQuery ? `${endpoint}${endpoint.includes('?') ? '&' : '?'}${listQuery}` : endpoint;
  const url = `${base}${base.includes('?') ? '&' : '?'}page=${page}&limit=${limit}`;
  if (!sort) return url;
  const order: TableSort[] = sort.field === 'id' ? [sort] : [sort, { field: 'id', direction: 'asc' }];
  return `${url}&sort=${encodeURIComponent(JSON.stringify(order))}`;
}

/** Header click: a new column sorts ascending, then descending, then back to the default order. */
export function nextSort(current: TableSort | null, field: string): TableSort | null {
  if (current?.field !== field) return { field, direction: 'asc' };
  return current.direction === 'asc' ? { field, direction: 'desc' } : null;
}
