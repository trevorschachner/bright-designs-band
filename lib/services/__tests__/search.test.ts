import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { collections } from '@/lib/collections'
import { searchCatalog as searchCatalogOf, type SqlRunner } from '@/lib/services/search'
import { createSearchDb, seed } from './search-db'

/**
 * searchCatalog against a real Postgres with the real migrations (pglite).
 * One catalog for the whole file; each test reads it.
 */
// The fixed collection list: the published one needs the app's cached reads.
const searchCatalog = (q: string, { database }: { database: SqlRunner }) => searchCatalogOf(q, { database, collections })

let client: PGlite
let db: Awaited<ReturnType<typeof createSearchDb>>['db']

beforeAll(async () => {
  ;({ client, db } = await createSearchDb())
  await seed(client, {
    shows: [
      { id: 1, title: 'Head in the Clouds', tags: ['Theme: Nature'] },
      { id: 2, title: 'Gold Rush', tags: ['Theme: Western'] },
    ],
    arrangements: [
      { id: 10, title: 'Up and Away', showId: 1, pieces: [{ title: 'Libertango', composer: 'Astor Piazzolla' }] },
      { id: 11, title: 'Starlight', showId: 1 },
      { id: 20, title: 'Prospector', showId: 2, pieces: [{ title: 'The Good, the Bad and the Ugly', composer: 'Ennio Morricone' }] },
      { id: 40, title: 'Nature Walk' },
      { id: 30, title: 'Café Noir', pieces: [{ title: 'The Phantom of the Opera', composer: 'Andrew Lloyd Webber' }] },
    ],
  })
}, 30_000)

const titles = (rows: { title: string }[]) => rows.map((r) => r.title)

describe('searchCatalog', () => {
  it('finds a part by the title of a source piece it uses', async () => {
    const results = await searchCatalog('libertango', { database: db })
    expect(titles(results.arrangements)).toEqual(['Up and Away'])
  })

  it('matches while the word is still being typed', async () => {
    expect(titles((await searchCatalog('liber', { database: db })).arrangements)).toEqual(['Up and Away'])
  })

  it('ignores accents and case', async () => {
    expect(titles((await searchCatalog('CAFE noir', { database: db })).arrangements)).toEqual(['Café Noir'])
  })

  it('still finds a part through a typo, and says the match was fuzzy', async () => {
    const typo = await searchCatalog('libretango', { database: db })
    expect(titles(typo.arrangements)).toEqual(['Up and Away'])
    expect(typo.fuzzy).toBe(true)
    const words = await searchCatalog('phantom opra', { database: db })
    expect(titles(words.arrangements)).toEqual(['Café Noir'])
  })

  it('groups results: a show found through a piece in one of its parts', async () => {
    const results = await searchCatalog('libertango', { database: db })
    expect(results.shows.map((s) => s.slug)).toEqual(['head-in-the-clouds'])
  })

  it('lists a matching source piece with the parts that use it', async () => {
    const results = await searchCatalog('morricone', { database: db })
    expect(results.pieces).toEqual([
      { id: expect.any(Number), title: 'The Good, the Bad and the Ugly', composer: 'Ennio Morricone', arrangements: [{ slug: 'prospector', title: 'Prospector' }] },
    ])
  })

  it('suggests a collection whose subject is in the query', async () => {
    const results = await searchCatalog('western shows', { database: db })
    expect(results.collections).toEqual([{ slug: 'western-marching-band-shows', title: 'Western and Americana Marching Band Shows' }])
    expect((await searchCatalog('marching band shows', { database: db })).collections).toEqual([])
  })

  it('returns nothing for an empty query', async () => {
    expect(await searchCatalog('   ', { database: db })).toEqual({ query: '', fuzzy: false, shows: [], arrangements: [], pieces: [], collections: [] })
  })

  it('ranks a title match above a theme the part inherits from its show', async () => {
    const results = await searchCatalog('nature', { database: db })
    expect(titles(results.arrangements)).toEqual(['Nature Walk', 'Starlight', 'Up and Away'])
  })

  it('ignores common words like "the" and "of" instead of requiring them', async () => {
    expect(titles((await searchCatalog('phantom of the', { database: db })).arrangements)).toEqual(['Café Noir'])
    await expect(searchCatalog('the', { database: db })).resolves.toMatchObject({ query: 'the' })
  })

  it('treats query syntax as plain words', async () => {
    const results = await searchCatalog("libertango & !'):*", { database: db })
    expect(titles(results.arrangements)).toEqual(['Up and Away'])
  })
})
