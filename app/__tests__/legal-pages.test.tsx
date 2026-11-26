import { render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import PrivacyPolicyPage from '../privacy/page'
import TermsOfUsePage from '../terms/page'
import { SiteFooter } from '@/components/layout/site-footer'
import { LEGAL_LAST_UPDATED } from '@/lib/content/legal'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe.each([
  ['privacy', PrivacyPolicyPage],
  ['terms', TermsOfUsePage],
])('/%s', (_name, Page) => {
  it('has no template placeholders left', () => {
    const { container } = render(<Page />)
    expect(container.textContent).not.toMatch(/\[[^\]]*\]/)
    expect(container.textContent).toContain('hello@brightdesigns.band')
    expect(container.textContent).toContain('Bright Designs LLC')
  })

  it('shows the fixed "Last updated" date, not today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2031-03-15T12:00:00Z'))
    render(<Page />)
    const time = screen.getByText(LEGAL_LAST_UPDATED.label)
    expect(time.tagName).toBe('TIME')
    expect(time.getAttribute('datetime')).toBe('2026-11-26')
    expect(document.body.textContent).not.toContain('2031')
  })
})

describe('terms', () => {
  it('is governed by South Carolina law and covers perusal scores', () => {
    render(<TermsOfUsePage />)
    expect(screen.getByRole('heading', { name: 'Perusal scores' })).toBeInTheDocument()
    expect(document.body.textContent).toContain('State of South Carolina')
  })
})

describe('privacy', () => {
  it('names the processors and the replay sample rate', () => {
    render(<PrivacyPolicyPage />)
    const text = document.body.textContent ?? ''
    for (const name of ['Netlify', 'Supabase', 'PostHog', 'Attio', 'Resend', 'Cloudflare Turnstile']) {
      expect(text).toContain(name)
    }
    expect(text).toContain('25%')
  })
})

describe('SiteFooter', () => {
  it('links to the privacy policy and terms', () => {
    render(<SiteFooter />)
    const legal = screen.getByRole('navigation', { name: 'Legal' })
    expect(within(legal).getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
    expect(within(legal).getByRole('link', { name: 'Terms of Use' })).toHaveAttribute('href', '/terms')
  })
})

describe('InquiryForm', () => {
  it('links the privacy policy under the submit button', async () => {
    // Radix radio and checkbox measure themselves; jsdom has no ResizeObserver.
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
    const { InquiryForm } = await import('@/components/forms/inquiry-form')
    render(<InquiryForm onSubmit={() => {}} isLoading={false} />)
    const notice = screen.getByText(/By sending this you agree to our/)
    expect(within(notice).getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
  })
})
