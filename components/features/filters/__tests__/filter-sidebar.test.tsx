import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FilterField } from '@/lib/filters/types'

/**
 * FilterSidebar writes its state to the URL: one router.replace, 300 ms after
 * the last change, with the serialised query and { scroll: false }. No second
 * debounce in the search box, no fetch.
 */

const { replace, search } = vi.hoisted(() => ({ replace: vi.fn(), search: { value: '' } }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/shows',
  useSearchParams: () => new URLSearchParams(search.value),
}))

import { FilterSidebar } from '@/components/features/filters/filter-sidebar'

const fields: FilterField[] = [
  { key: 'title', label: 'Title', type: 'text', operators: ['contains', 'equals'] },
  { key: 'year', label: 'Year', type: 'number', operators: ['equals', 'gt', 'lt'] },
  { key: 'difficulty', label: 'Difficulty', type: 'enum', operators: ['equals', 'in'] },
]

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  vi.stubGlobal('fetch', vi.fn())
  replace.mockReset()
  search.value = ''
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const searchBox = () => screen.getByPlaceholderText('Search shows...')

describe('FilterSidebar', () => {
  it('replaces the URL once, 300 ms after the last keystroke', () => {
    render(<FilterSidebar filterFields={fields} />)

    for (const text of ['g', 'go', 'gol', 'gold']) {
      fireEvent.change(searchBox(), { target: { value: text } })
      act(() => vi.advanceTimersByTime(100))
    }
    expect(replace).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(199))
    expect(replace).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(1))
    expect(replace).toHaveBeenCalledTimes(1)
    expect(replace).toHaveBeenCalledWith('/shows?search=gold', { scroll: false })

    act(() => vi.advanceTimersByTime(2000))
    expect(replace).toHaveBeenCalledTimes(1)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('writes a difficulty filter as JSON and resets to page 1', () => {
    search.value = 'page=3'
    render(<FilterSidebar filterFields={fields} />)

    fireEvent.click(screen.getByRole('checkbox', { name: 'Beginner' }))
    act(() => vi.advanceTimersByTime(300))

    expect(replace).toHaveBeenCalledTimes(1)
    const expected = new URLSearchParams({
      filters: JSON.stringify([{ field: 'difficulty', operator: 'in', values: ['Beginner'] }]),
    }).toString()
    expect(replace).toHaveBeenCalledWith(`/shows?${expected}`, { scroll: false })
  })

  it('commits at once on Enter', () => {
    render(<FilterSidebar filterFields={fields} />)
    fireEvent.change(searchBox(), { target: { value: 'apex' } })
    fireEvent.keyDown(searchBox(), { key: 'Enter' })
    expect(replace).toHaveBeenCalledTimes(1)
    expect(replace).toHaveBeenCalledWith('/shows?search=apex', { scroll: false })
    act(() => vi.advanceTimersByTime(1000))
    expect(replace).toHaveBeenCalledTimes(1)
  })

  it('does not navigate when the change leaves the URL as it is', () => {
    search.value = 'search=apex'
    render(<FilterSidebar filterFields={fields} />)
    expect(searchBox()).toHaveValue('apex')
    fireEvent.change(searchBox(), { target: { value: 'apex ' } })
    act(() => vi.advanceTimersByTime(300))
    expect(replace).not.toHaveBeenCalled()
  })

  it('keeps a trailing space while typing, after the URL lands without it', () => {
    const { rerender } = render(<FilterSidebar filterFields={fields} />)
    fireEvent.change(searchBox(), { target: { value: 'gold ' } })
    act(() => vi.advanceTimersByTime(300))
    expect(replace).toHaveBeenCalledWith('/shows?search=gold', { scroll: false })

    // The navigation lands: the URL now says search=gold.
    search.value = 'search=gold'
    rerender(<FilterSidebar filterFields={fields} />)
    expect(searchBox()).toHaveValue('gold ')

    fireEvent.change(searchBox(), { target: { value: 'gold r' } })
    act(() => vi.advanceTimersByTime(300))
    expect(replace).toHaveBeenLastCalledWith('/shows?search=gold+r', { scroll: false })
  })

  it('still follows the URL when it changes to a different search', () => {
    const { rerender } = render(<FilterSidebar filterFields={fields} />)
    expect(searchBox()).toHaveValue('')
    search.value = 'search=apex'
    rerender(<FilterSidebar filterFields={fields} />)
    expect(searchBox()).toHaveValue('apex')
  })

  it('gives two mounted sidebars (desktop + mobile sheet) distinct ids', () => {
    render(
      <>
        <FilterSidebar filterFields={fields} />
        <FilterSidebar filterFields={fields} />
      </>
    )
    const ids = [...document.querySelectorAll('[id]')].map((el) => el.id)
    expect(ids.length).toBeGreaterThan(4)
    expect(new Set(ids).size).toBe(ids.length)
    // Each label still points at its own control.
    const boxes = screen.getAllByRole('checkbox', { name: 'Beginner' })
    expect(boxes).toHaveLength(2)
    expect(boxes[0].id).not.toBe(boxes[1].id)
  })
})
