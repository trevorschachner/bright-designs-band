/**
 * Links into the contact form with the "Inquiry Topic or Project" field
 * prefilled, so a director who clicks "Talk to us" from a show or arrangement
 * doesn't have to retype what they were looking at.
 */
export const CONTACT_INTEREST_PARAM = 'interest'

// The API caps showInterest at 500 characters; stay well under it.
const MAX_INTEREST_LENGTH = 200

export function contactHref(interest: string): string {
  const value = interest.trim()
  if (!value) return '/contact'
  return `/contact?${CONTACT_INTEREST_PARAM}=${encodeURIComponent(value)}`
}

export function showContactHref(showTitle: string): string {
  return contactHref(`Show: ${showTitle}`)
}

export function arrangementContactHref(arrangementTitle: string): string {
  return contactHref(`Arrangement: ${arrangementTitle}`)
}

/** Reads the prefill value back off the query string, bounded and trimmed. */
export function readContactInterest(value: string | null | undefined): string {
  if (!value) return ''
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, MAX_INTEREST_LENGTH)
}
