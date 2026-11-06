import { describe, it, expect } from 'vitest'
import { attioServices, seasonFor, syncSubmissionToAttio, type AttioSubmission } from '../attio'

type Call = { method: string; path: string; body: any }

/** A fake Attio: answers by method + path, records every call. */
function fakeAttio(state: {
  people?: any[]
  companies?: any[]
  deals?: any[]
  seasons?: string[]
  fail?: string
}) {
  const calls: Call[] = []
  const record = (id: string, extra: Record<string, unknown> = {}) => ({
    id: { record_id: id },
    web_url: `https://app.attio.com/bright-designs/x/${id}`,
    values: {},
    ...extra,
  })
  const fetchImpl = (async (url: string, init: RequestInit) => {
    const path = url.replace('https://api.attio.com/v2', '')
    const body = init.body ? JSON.parse(String(init.body)) : undefined
    calls.push({ method: String(init.method), path, body })
    const ok = (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 })
    if (state.fail && path.startsWith(state.fail)) return new Response('{"message":"nope"}', { status: 400 })
    if (path === '/objects/people/records/query') return ok(state.people ?? [])
    if (path === '/objects/companies/records/query') return ok(state.companies ?? [])
    if (path === '/objects/deals/records/query') return ok(state.deals ?? [])
    if (path === '/objects/deals/attributes/season/options')
      return ok((state.seasons ?? ['2026', '2027']).map((title) => ({ title, is_archived: false })))
    if (path === '/objects/people/records') return ok(record('person-new'))
    if (path === '/objects/deals/records') return ok(record('deal-new'))
    if (path === '/notes') return ok({ id: { note_id: 'n1' } })
    return new Response('not found', { status: 404 })
  }) as unknown as typeof fetch
  return { calls, fetchImpl, record }
}

const inquiry: AttioSubmission = {
  kind: 'inquiry',
  email: 'dana@rockcanyon.org',
  firstName: 'Dana',
  lastName: 'Director',
  school: 'Rock Canyon HS',
  services: ['drill', 'wind-arranging', 'solos'],
  showInterest: 'Show: Hive Mind',
  message: 'We would love a quote.',
  pageUrl: '/contact?interest=Show%3A%20Hive%20Mind',
  referrerUrl: '/shows/hive-mind',
  submissionId: 7,
  siteUrl: 'https://brightdesigns.band',
}
const OCT_2026 = new Date('2026-10-21T12:00:00Z')
const deps = (fetchImpl: typeof fetch) => ({ apiKey: 'k', ownerEmail: 'owner@brightdesigns.band', fetch: fetchImpl, now: OCT_2026 })
const find = (calls: Call[], method: string, path: string) => calls.find((c) => c.method === method && c.path === path)

describe('seasonFor / attioServices', () => {
  it('asks about next season from September on', () => {
    expect(seasonFor(new Date('2026-08-31T12:00:00'))).toBe('2026')
    expect(seasonFor(new Date('2026-09-01T12:00:00'))).toBe('2027')
    expect(seasonFor(new Date('2027-03-01T12:00:00'))).toBe('2027')
  })
  it('maps form services to Attio options, dropping ones it has no option for', () => {
    expect(attioServices(['drill', 'drill-design', 'wind-arranging', 'solos'])).toEqual(['Drill', 'Winds'])
    expect(attioServices(undefined)).toEqual([])
  })
})

describe('syncSubmissionToAttio', () => {
  it('skips without an API key, making no calls', async () => {
    const { calls, fetchImpl } = fakeAttio({})
    expect(await syncSubmissionToAttio(inquiry, { ...deps(fetchImpl), apiKey: undefined })).toEqual({
      status: 'skipped',
      reason: 'ATTIO_API_KEY is not set',
    })
    expect(calls).toHaveLength(0)
  })

  it('creates the person and a Lead deal linked to the one matching school, with a note on the deal', async () => {
    const attio = fakeAttio({ companies: [{ id: { record_id: 'co1' }, values: {} }] })
    const result = await syncSubmissionToAttio(inquiry, deps(attio.fetchImpl))
    expect(result).toEqual({ status: 'synced', recordUrl: 'https://app.attio.com/bright-designs/x/deal-new' })

    const person = find(attio.calls, 'POST', '/objects/people/records')!.body.data.values
    expect(person.email_addresses).toEqual(['dana@rockcanyon.org'])
    expect(person.name[0]).toMatchObject({ first_name: 'Dana', last_name: 'Director', full_name: 'Dana Director' })
    expect(person.company).toEqual([{ target_object: 'companies', target_record_id: 'co1' }])

    const deal = find(attio.calls, 'POST', '/objects/deals/records')!.body.data.values
    expect(deal).toMatchObject({
      name: 'Rock Canyon HS: 2027',
      stage: 'Lead',
      owner: 'owner@brightdesigns.band',
      source: 'Website form',
      season: '2027',
      services: ['Drill', 'Winds'],
      deal_type: 'Resale',
      associated_people: [{ target_object: 'people', target_record_id: 'person-new' }],
      associated_company: [{ target_object: 'companies', target_record_id: 'co1' }],
    })

    const note = find(attio.calls, 'POST', '/notes')!.body.data
    expect(note).toMatchObject({ parent_object: 'deals', parent_record_id: 'deal-new', title: 'Website inquiry', format: 'plaintext' })
    expect(note.content).toContain('Message: We would love a quote.')
    expect(note.content).toContain('Sent from page: /contact?interest=Show%3A%20Hive%20Mind')
    expect(note.content).toContain('Came from: /shows/hive-mind')
    expect(note.content).toContain('Admin: https://brightdesigns.band/admin/inquiries')
    expect(note.content).not.toContain('link one by hand')
  })

  it('reuses an existing person without editing them, and adds to their open deal instead of opening another', async () => {
    const attio = fakeAttio({
      people: [{ id: { record_id: 'p1' }, web_url: 'https://app.attio.com/bright-designs/person/p1', values: {} }],
      deals: [
        { id: { record_id: 'd-lost' }, values: { stage: [{ status: { title: 'Lost' } }] } },
        { id: { record_id: 'd-open' }, web_url: 'https://app.attio.com/bright-designs/deal/d-open', values: { stage: [{ status: { title: 'Contacted' } }] } },
      ],
    })
    const result = await syncSubmissionToAttio(inquiry, deps(attio.fetchImpl))
    expect(result).toEqual({ status: 'synced', recordUrl: 'https://app.attio.com/bright-designs/deal/d-open' })
    expect(find(attio.calls, 'POST', '/objects/people/records')).toBeUndefined()
    expect(find(attio.calls, 'POST', '/objects/deals/records')).toBeUndefined()
    const note = find(attio.calls, 'POST', '/notes')!.body.data
    expect(note.parent_record_id).toBe('d-open')
    expect(note.content).toContain('Added to the open deal this person already had.')
  })

  it('says in the note when the school matched no company or several, and links none', async () => {
    for (const companies of [[], [{ id: { record_id: 'a' } }, { id: { record_id: 'b' } }]]) {
      const attio = fakeAttio({ companies })
      await syncSubmissionToAttio(inquiry, deps(attio.fetchImpl))
      const deal = find(attio.calls, 'POST', '/objects/deals/records')!.body.data.values
      expect(deal.associated_company).toBeUndefined()
      expect(find(attio.calls, 'POST', '/notes')!.body.data.content).toMatch(/Attio compan(y is|ies are) named "Rock Canyon HS"/)
    }
  })

  it('leaves the season off when Attio has no option for it yet', async () => {
    const attio = fakeAttio({ seasons: ['2026'] })
    await syncSubmissionToAttio(inquiry, deps(attio.fetchImpl))
    const deal = find(attio.calls, 'POST', '/objects/deals/records')!.body.data.values
    expect(deal.season).toBeUndefined()
    expect(deal.name).toBe('Rock Canyon HS: 2027')
  })

  it('gives a guide download a person and a note, but no deal', async () => {
    const attio = fakeAttio({})
    const result = await syncSubmissionToAttio({ kind: 'resource_download', email: 'g@x.org', firstName: 'Gus', lastName: '' }, deps(attio.fetchImpl))
    expect(result).toEqual({ status: 'synced', recordUrl: 'https://app.attio.com/bright-designs/x/person-new' })
    expect(attio.calls.some((c) => c.path.startsWith('/objects/deals'))).toBe(false)
    expect(find(attio.calls, 'POST', '/notes')!.body.data).toMatchObject({ parent_object: 'people', title: 'Website: guide download' })
  })

  it('reports an Attio error instead of throwing', async () => {
    const attio = fakeAttio({ fail: '/objects/deals/records' })
    const result = await syncSubmissionToAttio(inquiry, deps(attio.fetchImpl))
    expect(result.status).toBe('failed')
    expect(result.status === 'failed' && result.error).toMatch(/Attio POST \/objects\/deals\/records(\/query)? → 400/)
  })
})
