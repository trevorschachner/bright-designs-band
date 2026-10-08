import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AdminTable, { type ColumnDef } from '@/components/features/admin/AdminTable'
import { buildListUrl } from '@/components/features/admin/admin-table-urls'

type Row = { id: number; title: string }
const columns: ColumnDef<Row>[] = [{ header: 'Title', accessorKey: 'title', sortable: true }]

const fetchMock = vi.fn<(url: string) => Promise<Response>>()
const requested = () => fetchMock.mock.calls.map(([url]) => url)

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockImplementation(async () =>
    new Response(JSON.stringify({ data: { data: [{ id: 1, title: 'Apex' }], pagination: { total: 1, totalPages: 1 } } })),
  )
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

function renderTable() {
  return render(
    <AdminTable<Row>
      endpoint="/api/shows"
      listQuery="admin=true"
      columns={columns}
      resourceName="shows"
      onDelete={async () => ({ ok: true, data: null })}
    />,
  )
}

describe('buildListUrl q', () => {
  it('adds the trimmed, encoded term and omits a blank one', () => {
    expect(buildListUrl('/api/shows', 'admin=true', 1, 20, null, '  true north ')).toBe(
      '/api/shows?admin=true&page=1&limit=20&q=true%20north',
    )
    expect(buildListUrl('/api/shows', 'admin=true', 1, 20, null, '   ')).toBe('/api/shows?admin=true&page=1&limit=20')
  })
})

describe('AdminTable search', () => {
  it('sends typed text as ?q= after a pause, back on page 1, alongside the sort', async () => {
    const user = userEvent.setup()
    renderTable()
    await waitFor(() => expect(requested()).toEqual(['/api/shows?admin=true&page=1&limit=20']))

    await user.click(await screen.findByRole('button', { name: /title/i }))
    await waitFor(() => expect(requested().at(-1)).toContain('&sort='))

    await user.type(screen.getByRole('searchbox', { name: 'Search shows' }), 'north')
    await waitFor(() => expect(requested().at(-1)).toContain('&q=north'))

    const last = new URL(requested().at(-1)!, 'http://x')
    expect(last.searchParams.get('q')).toBe('north')
    expect(last.searchParams.get('page')).toBe('1')
    expect(last.searchParams.get('admin')).toBe('true')
    expect(JSON.parse(last.searchParams.get('sort')!)[0]).toEqual({ field: 'title', direction: 'asc' })
    // Debounced: one request for the whole word, not one per key.
    expect(requested().filter((u) => u.includes('&q='))).toHaveLength(1)
  })

  it('keeps the search box (and its text) while the next page loads', async () => {
    const user = userEvent.setup()
    renderTable()
    const box = await screen.findByRole('searchbox', { name: 'Search shows' })
    await user.type(box, 'apex')
    await waitFor(() => expect(requested().at(-1)).toContain('&q=apex'))
    expect(screen.getByRole('searchbox', { name: 'Search shows' })).toHaveValue('apex')
  })

  it('clearing the box drops q', async () => {
    const user = userEvent.setup()
    renderTable()
    const box = await screen.findByRole('searchbox', { name: 'Search shows' })
    await user.type(box, 'apex')
    await waitFor(() => expect(requested().at(-1)).toContain('&q=apex'))
    await user.clear(box)
    await waitFor(() => expect(requested().at(-1)).toBe('/api/shows?admin=true&page=1&limit=20'))
  })
})
