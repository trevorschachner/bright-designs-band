// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { pageTrail, postContact, recordPage } from '../page-trail'

function visit(path: string) {
  window.history.pushState({}, '', path)
  recordPage()
}

beforeEach(() => {
  window.sessionStorage.clear()
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
    expect(JSON.parse(String((init as RequestInit).body))).toEqual({ email: 'a@b.org', type: 'inquiry', pageUrl: '/shows/starlight' })
    fetchSpy.mockRestore()
  })
})
