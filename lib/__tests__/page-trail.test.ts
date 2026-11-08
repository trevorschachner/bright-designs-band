// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
const trackClientEvent = vi.hoisted(() => vi.fn())
vi.mock('@/lib/observability/track', () => ({ trackClientEvent }))

import { firstTouch, pageTrail, postContact, recordPage } from '../page-trail'

function visit(path: string) {
  window.history.pushState({}, '', path)
  recordPage()
}

beforeEach(() => {
  window.sessionStorage.clear()
  window.localStorage.clear()
  window.history.pushState({}, '', '/')
})

describe('page trail', () => {
  it('reports the current page and the in-site page before it', () => {
    visit('/shows/hive-mind')
    visit('/contact?interest=Show%3A%20Hive%20Mind')
    expect(pageTrail()).toEqual({ pageUrl: '/contact?interest=Show%3A%20Hive%20Mind', referrerUrl: '/shows/hive-mind' })
  })

  it('ignores a repeat of the same page', () => {
    visit('/shows/hive-mind')
    visit('/contact')
    visit('/contact')
    expect(pageTrail().referrerUrl).toBe('/shows/hive-mind')
  })

  it('falls back to the external referrer on the first page of a visit', () => {
    vi.spyOn(document, 'referrer', 'get').mockReturnValue('https://www.google.com/')
    visit('/contact')
    expect(pageTrail()).toEqual({ pageUrl: '/contact', referrerUrl: 'https://www.google.com/' })
    vi.restoreAllMocks()
  })

  it('still reports the page when storage is unavailable', () => {
    vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new Error('blocked')
    })
    window.history.pushState({}, '', '/contact')
    expect(() => recordPage()).not.toThrow()
    expect(pageTrail()).toEqual({ pageUrl: '/contact' })
    vi.restoreAllMocks()
  })

  it('postContact sends the payload with the trail attached', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'))
    visit('/shows/starlight')
    await postContact({ email: 'a@b.org', type: 'inquiry' })
    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe('/api/contact')
    expect(JSON.parse(String((init as RequestInit).body))).toEqual({
      email: 'a@b.org',
      type: 'inquiry',
      pageUrl: '/shows/starlight',
      firstTouch: { landingUrl: '/shows/starlight' },
    })
    fetchSpy.mockRestore()
  })

  it('postContact records a conversion only when the submission succeeds', async () => {
    trackClientEvent.mockClear()
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('{}', { status: 500 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
    await postContact({ email: 'a@b.org', type: 'inquiry', source: 'contact' })
    expect(trackClientEvent).not.toHaveBeenCalled()
    await postContact({ email: 'a@b.org', type: 'inquiry', source: 'contact' })
    expect(trackClientEvent).toHaveBeenCalledWith('contact.submitted', { type: 'inquiry', source: 'contact' })
    fetchSpy.mockRestore()
  })

  it('remembers the first visit, with its external referrer and UTM tags, and never overwrites it', () => {
    vi.spyOn(document, 'referrer', 'get').mockReturnValue('https://www.instagram.com/')
    visit('/shows/hive-mind?utm_source=instagram&utm_medium=social&utm_campaign=spring')
    vi.restoreAllMocks()
    visit('/contact')
    window.sessionStorage.clear() // a later visit, in a new tab
    vi.spyOn(document, 'referrer', 'get').mockReturnValue('https://www.google.com/')
    visit('/about')
    vi.restoreAllMocks()
    expect(firstTouch()).toEqual({
      landingUrl: '/shows/hive-mind?utm_source=instagram&utm_medium=social&utm_campaign=spring',
      referrer: 'https://www.instagram.com/',
      utmSource: 'instagram',
      utmMedium: 'social',
      utmCampaign: 'spring',
    })
  })

  it('ignores a corrupt stored first touch', () => {
    window.localStorage.setItem('bd:first-touch', '{not json')
    expect(firstTouch()).toBeUndefined()
  })
})
