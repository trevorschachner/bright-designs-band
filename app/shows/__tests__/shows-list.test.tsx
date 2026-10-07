import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

/**
 * /shows renders its list on the server. ShowsList takes the parsed filters,
 * reads through queryShows and returns real links; nothing fetches from the
 * browser.
 */

const { queryShows } = vi.hoisted(() => ({ queryShows: vi.fn() }))
vi.mock('@/lib/services/catalog', () => ({ queryShows, SHOWS_DEFAULT_LIMIT: 24 }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/shows',
  useSearchParams: () => new URLSearchParams(''),
}))

import { ShowsList } from '@/components/features/catalog/ShowsList'

const show = (id: number) => ({
  id,
  slug: `show-${id}`,
  title: `Show ${id}`,
  description: 'A show',
  year: 2025,
  difficulty: 'Intermediate',
  duration: '7:00',
  price: 1500,
  thumbnailUrl: `https://cdn.example/${id}.webp`,
  graphicUrl: null,
  featured: false,
  displayOrder: 0,
  createdAt: null,
  arrangements: [{ id: 100 + id, title: 'Opener', scene: 'Opener', durationSeconds: 90, sampleScoreUrl: null }],
  showsToTags: [{ tag: { id: 1, name: 'Dark' } }],
})

const fetchSpy = vi.fn()

beforeEach(() => {
  queryShows.mockReset()
  fetchSpy.mockReset()
  vi.stubGlobal('fetch', fetchSpy)
})
afterEach(() => vi.unstubAllGlobals())

async function renderList(filters = { page: 1, limit: 24, conditions: [], sort: [] }) {
  render(await ShowsList({ filters }))
}

describe('ShowsList', () => {
  it('renders a link to every show on the page, without fetching', async () => {
    queryShows.mockResolvedValue({ rows: [show(1), show(2), show(3)], total: 3, page: 1, pageSize: 24, totalPages: 1 })
    await renderList()

    for (const id of [1, 2, 3]) {
      expect(document.querySelector(`a[href="/shows/show-${id}"]`)).not.toBeNull()
    }
    expect(screen.getByRole('link', { name: 'Show 1' })).toHaveAttribute('href', '/shows/show-1')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('draws one image per card, prioritised only for the first card of page 1', async () => {
    queryShows.mockResolvedValue({ rows: [show(1), show(2)], total: 2, page: 1, pageSize: 24, totalPages: 1 })
    await renderList()

    const images = document.querySelectorAll('img')
    expect(images).toHaveLength(2)
    // `priority` renders eager (no loading="lazy"); every other card is lazy.
    expect(images[0].getAttribute('loading')).toBeNull()
    expect(images[1].getAttribute('loading')).toBe('lazy')
    expect(images[0].getAttribute('sizes')).toBe('(max-width: 640px) 80px, (max-width: 1024px) 50vw, 33vw')
  })

  it('does not prioritise an image on later pages', async () => {
    queryShows.mockResolvedValue({ rows: [show(30)], total: 30, page: 2, pageSize: 24, totalPages: 2 })
    await renderList({ page: 2, limit: 24, conditions: [], sort: [] })
    expect(document.querySelector('img')?.getAttribute('loading')).toBe('lazy')
  })

  it('paginates with real links that keep the filters', async () => {
    queryShows.mockResolvedValue({ rows: [show(1)], total: 60, page: 1, pageSize: 24, totalPages: 3 })
    await renderList({ page: 1, limit: 24, conditions: [], sort: [], search: 'apex' } as never)

    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute('href', '/shows?search=apex&page=2')
    expect(screen.getByRole('link', { name: 'Next page' })).toHaveAttribute('href', '/shows?search=apex&page=2')
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
  })

  it('renders the empty state with a link back to the unfiltered catalog', async () => {
    queryShows.mockResolvedValue({ rows: [], total: 0, page: 1, pageSize: 24, totalPages: 0 })
    await renderList()
    expect(screen.getByText('No shows found')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Clear All Filters' })).toHaveAttribute('href', '/shows')
  })
})
