/** Path part of an endpoint, with any query string or hash removed. */
const pathOf = (endpoint: string): string => endpoint.split(/[?#]/)[0].replace(/\/+$/, '');

export function buildDeleteUrl(endpoint: string, id: number | string): string {
  return `${pathOf(endpoint)}/${encodeURIComponent(String(id))}`;
}

/** List URL: endpoint plus optional fixed query (e.g. "all=true") plus paging. */
export function buildListUrl(
  endpoint: string,
  listQuery: string | undefined,
  page: number,
  limit: number,
): string {
  const base = listQuery ? `${endpoint}${endpoint.includes('?') ? '&' : '?'}${listQuery}` : endpoint;
  return `${base}${base.includes('?') ? '&' : '?'}page=${page}&limit=${limit}`;
}
