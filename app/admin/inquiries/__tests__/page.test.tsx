import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { InquiryRow } from '@/lib/services/admin'

const mocks = vi.hoisted(() => ({
  guard: vi.fn(),
  getInquiriesPage: vi.fn(),
  redirect: vi.fn((to: string) => {
    throw new Error(`redirect:${to}`)
  }),
}))
vi.mock('@/lib/auth/guard', () => ({ guard: mocks.guard }))
vi.mock('@/lib/services/admin', () => ({ getInquiriesPage: mocks.getInquiriesPage }))
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }))

import InquiriesPage from '@/app/admin/inquiries/page'
import { previewOf, PREVIEW_CHARS } from '@/app/admin/inquiries/InquiryCells'
import { attioSearchUrl } from '@/app/admin/inquiries/InquiriesTable'

const LONG = `${'We are a 3A band looking for a ballad-forward show. '.repeat(5)}Call me.`
const rows: InquiryRow[] = [
  {
    id: 2,
    createdAt: '2026-10-06T15:30:00.000Z',
    name: 'Dana Director',
    email: 'dana+band@school.org',
    service: 'existing-show, drill',
    source: 'contact',
    message: LONG,
  },
  { id: 1, createdAt: '2026-10-01T12:00:00.000Z', name: 'Sam', email: 'sam@x.edu', service: 'General Contact', source: 'show-page', message: 'Short note.' },
]

async function renderPage(search: Record<string, string> = {}) {
  render(await InquiriesPage({ searchParams: Promise.resolve(search) }))
}

beforeEach(() => {
  mocks.guard.mockReset().mockResolvedValue({ denied: null, email: 'a@b.c', role: 'editor' })
  mocks.getInquiriesPage.mockReset().mockResolvedValue({ data: rows, total: 30 })
})

describe('previewOf', () => {
  it('keeps a short message and cuts a long one to at most 120 characters plus an ellipsis', () => {
    expect(previewOf('Short note.')).toBe('Short note.')
    const preview = previewOf(LONG)
    expect(preview.endsWith('…')).toBe(true)
    expect(preview.length).toBeLessThanOrEqual(PREVIEW_CHARS + 1)
    expect(LONG.startsWith(preview.slice(0, -1))).toBe(true)
  })
})

describe('/admin/inquiries', () => {
  it('renders one row per submission with date, name, email, service and source', async () => {
    await renderPage()
    const body = screen.getAllByRole('rowgroup')[1]
    const trs = within(body).getAllByRole('row')
    expect(trs).toHaveLength(2)
    expect(within(trs[0]).getByText('Dana Director')).toBeInTheDocument()
    expect(within(trs[0]).getByRole('link', { name: 'dana+band@school.org' })).toHaveAttribute('href', 'mailto:dana+band@school.org')
    expect(within(trs[0]).getByText('existing-show, drill')).toBeInTheDocument()
    expect(within(trs[1]).getByText('show-page')).toBeInTheDocument()
    expect(within(trs[0]).getByText(/Oct 6, 2026/)).toBeInTheDocument()
    expect(mocks.getInquiriesPage).toHaveBeenCalledWith({ page: 1, limit: 25 })
  })

  it('shows a 120-character preview and expands to the full message inline', async () => {
    const user = userEvent.setup()
    await renderPage()
    const row = within(screen.getAllByRole('rowgroup')[1]).getAllByRole('row')[0]
    expect(within(row).queryByText(LONG.trim())).toBeNull()
    expect(within(row).getByText(previewOf(LONG))).toBeInTheDocument()

    const toggle = within(row).getByRole('button', { name: 'Show all' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)
    expect(within(row).getByText(LONG.trim())).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true')

    // A short message has nothing to expand.
    const short = within(screen.getAllByRole('rowgroup')[1]).getAllByRole('row')[1]
    expect(within(short).queryByRole('button', { name: 'Show all' })).toBeNull()
  })

  it('links each row to an Attio search for the email and offers a copy button', async () => {
    await renderPage()
    const row = within(screen.getAllByRole('rowgroup')[1]).getAllByRole('row')[0]
    expect(within(row).getByRole('link', { name: 'Open in Attio' })).toHaveAttribute(
      'href',
      'https://app.attio.com/bright-designs/search?q=dana%2Bband%40school.org',
    )
    expect(attioSearchUrl('a b@c')).toBe('https://app.attio.com/bright-designs/search?q=a%20b%40c')
    expect(within(row).getByRole('button', { name: 'Copy dana+band@school.org' })).toBeInTheDocument()
  })

  it('pages with ?page= and offers no edit or delete controls', async () => {
    await renderPage({ page: '2' })
    expect(mocks.getInquiriesPage).toHaveBeenCalledWith({ page: 2, limit: 25 })
    expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute('href', '/admin/inquiries')
    expect(screen.queryByRole('link', { name: 'Next' })).toBeNull()
    expect(screen.queryByRole('button', { name: /delete|edit|save/i })).toBeNull()
  })

  it('redirects without admin access', async () => {
    mocks.guard.mockResolvedValue({ denied: new Response(null, { status: 403 }) })
    await expect(renderPage()).rejects.toThrow('redirect:/')
    expect(mocks.getInquiriesPage).not.toHaveBeenCalled()
  })
})
