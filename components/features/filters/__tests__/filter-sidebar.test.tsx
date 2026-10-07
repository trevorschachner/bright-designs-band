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
})
