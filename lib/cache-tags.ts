/**
 * Cache tags and page paths, in one place so reads (which tag their cache
 * entries) and writes (which invalidate them) cannot drift apart.
 *
 * Reads tag an entry with every entity it reads, not only its own: a show list
 * that joins arrangement titles carries `arrangements` too. Writes then only
 * have to invalidate their own entity. See lib/services/README.md.
 */
export const TAGS = {
  shows: 'shows',
  show: (id: number | string) => `show:${id}`,
  arrangements: 'arrangements',
  arrangement: (id: number | string) => `arrangement:${id}`,
  tags: 'tags',
  pieces: 'pieces',
  resources: 'resources',
} as const

export const PATHS = {
  show: (slug: string) => `/shows/${slug}`,
  arrangement: (id: number | string) => `/arrangements/${id}`,
  home: '/',
  shows: '/shows',
  arrangements: '/arrangements',
  sitemap: '/sitemap.xml',
  llms: '/llms.txt',
  llmsFull: '/llms-full.txt',
} as const
