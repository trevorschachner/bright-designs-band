import { describe, expect, it } from 'vitest'
import {
  arrangementContactHref,
  contactHref,
  CONTACT_INTEREST_PARAM,
  readContactInterest,
  showContactHref,
} from '../contact-link'

const interestOf = (href: string) =>
  new URL(href, 'https://example.com').searchParams.get(CONTACT_INTEREST_PARAM)

describe('contact prefill links', () => {
  it('round-trips a show title through the query string', () => {
    const href = showContactHref('Rock & Roll: Part 2?')
    expect(href.startsWith('/contact?')).toBe(true)
    expect(readContactInterest(interestOf(href))).toBe('Show: Rock & Roll: Part 2?')
  })

  it('labels arrangements so the inquiry says what was clicked', () => {
    expect(readContactInterest(interestOf(arrangementContactHref('Libertango')))).toBe('Arrangement: Libertango')
  })

  it('falls back to the bare contact page for an empty topic', () => {
    expect(contactHref('   ')).toBe('/contact')
  })

  it('bounds and flattens whatever arrives on the query string', () => {
    expect(readContactInterest(null)).toBe('')
    expect(readContactInterest('a\r\nb')).toBe('a b')
    expect(readContactInterest('x'.repeat(1000))).toHaveLength(200)
  })
})
