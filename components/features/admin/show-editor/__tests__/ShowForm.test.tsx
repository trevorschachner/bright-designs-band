import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { EditableShow } from '@/lib/services/admin'

/**
 * ShowForm: explicit save through `updateShow`, with the loaded `updatedAt`.
 * The actions are mocked at the module seam the form imports.
 */

const mocks = vi.hoisted(() => ({
  updateShow: vi.fn(),
  createShow: vi.fn(),
  setShowThumbnail: vi.fn(),
  uploadFileDirect: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace, refresh: mocks.refresh, prefetch: vi.fn() }),
}))
vi.mock('@/lib/actions/shows', () => ({ updateShow: mocks.updateShow, createShow: mocks.createShow }))
vi.mock('@/lib/actions/files', () => ({ setShowThumbnail: mocks.setShowThumbnail }))
vi.mock('@/lib/uploads/direct-upload', () => ({ uploadFileDirect: mocks.uploadFileDirect }))

import { ShowForm } from '@/components/features/admin/show-editor/ShowForm'

const LOADED = '2026-10-07T12:00:00.000Z'
const SHOW: EditableShow = {
  id: 7,
  slug: 'my-show',
  title: 'My Show',
  description: null,
  year: 2025,
  difficulty: 'Advanced',
  duration: '8:30',
  programNotes: null,
  ensembleSize: null,
  includes: null,
  thumbnailUrl: null,
  videoUrl: null,
  youtubeUrl: null,
  featured: false,
  displayOrder: 0,
  commissioned: null,
  programCoordinator: null,
  percussionArranger: 'Ryan Wilhite',
  soundDesigner: null,
  windArranger: 'Brighton Barrineau, Trevor Schachner',
  drillWriter: null,
  updatedAt: LOADED,
  tagIds: [2],
}
const TAGS = [
  { id: 2, name: 'Small Band' },
  { id: 3, name: 'Dark' },
]

const renderEdit = (onStamp = vi.fn()) =>
  render(<ShowForm mode="edit" show={SHOW} allTags={TAGS} updatedAt={LOADED} onStamp={onStamp} />)

beforeEach(() => {
  Object.values(mocks).forEach((fn) => fn.mockReset())
})

describe('ShowForm', () => {
  it('requires a title: no action call, a field error', async () => {
    renderEdit()
    const title = screen.getByLabelText(/Title/)
    await userEvent.clear(title)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Title is required')).toBeInTheDocument()
    expect(mocks.updateShow).not.toHaveBeenCalled()
  })

  it('shows the dirty indicator after typing and enables Save', async () => {
    renderEdit()
    expect(screen.queryByTestId('dirty-indicator')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    await userEvent.type(screen.getByLabelText('Duration'), '0')
    expect(screen.getByTestId('dirty-indicator')).toHaveTextContent('Unsaved changes')
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  it('keeps the slug read-only until Edit URL, then validates the pattern and warns about the redirect', async () => {
    renderEdit()
    const slug = screen.getByLabelText('URL')
    expect(slug).toHaveAttribute('readonly')
    fireEvent.click(screen.getByRole('button', { name: 'Edit URL' }))
    expect(slug).not.toHaveAttribute('readonly')
    await userEvent.clear(slug)
    await userEvent.type(slug, 'Bad Slug')
    expect(screen.getByText('The old URL /shows/my-show will redirect to the new one.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Slug must be lowercase words separated by hyphens')).toBeInTheDocument()
    expect(mocks.updateShow).not.toHaveBeenCalled()
  })

  it('saves with id + loaded updatedAt, no slug unless edited; passes the new stamp up', async () => {
    const onStamp = vi.fn()
    mocks.updateShow.mockResolvedValue({
      ok: true,
      data: { id: 7, slug: 'my-show', title: 'My Show!', featured: false, updatedAt: '2026-10-07T12:05:00.000Z' },
    })
    renderEdit(onStamp)
    await userEvent.type(screen.getByLabelText(/Title/), '!')
    fireEvent.click(screen.getByLabelText('Dark'))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(mocks.updateShow).toHaveBeenCalledTimes(1))
    const input = mocks.updateShow.mock.calls[0][0]
    expect(input).toMatchObject({ id: 7, updatedAt: LOADED, title: 'My Show!', year: 2025, difficulty: 'Advanced', tags: [2, 3] })
    expect(input).not.toHaveProperty('slug')
    await waitFor(() => expect(onStamp).toHaveBeenCalledWith('2026-10-07T12:05:00.000Z'))
    expect(screen.queryByTestId('dirty-indicator')).not.toBeInTheDocument()
  })

  it('saves program notes, ensemble size and includes', async () => {
    mocks.updateShow.mockResolvedValue({
      ok: true,
      data: { id: 7, slug: 'my-show', title: 'My Show', featured: false, updatedAt: '2026-10-07T12:05:00.000Z' },
    })
    renderEdit()
    await userEvent.type(screen.getByLabelText('Program notes'), 'A wolf-pack show.')
    await userEvent.selectOptions(screen.getByLabelText('Ensemble size'), 'medium')
    fireEvent.click(screen.getByLabelText('percussion'))
    fireEvent.click(screen.getByLabelText('winds'))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(mocks.updateShow).toHaveBeenCalledTimes(1))
    expect(mocks.updateShow.mock.calls[0][0]).toMatchObject({
      programNotes: 'A wolf-pack show.',
      ensembleSize: 'medium',
      includes: 'winds, percussion',
    })
  })

  it('shows the stale alert with a Reload button when the action returns stale', async () => {
    mocks.updateShow.mockResolvedValue({ ok: false, error: 'stale' })
    renderEdit()
    await userEvent.type(screen.getByLabelText('Duration'), '0')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(
      await screen.findByText('This show was changed by someone else. Reload to see their changes.')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument()
  })

  it('maps invalid issues onto their fields, and a slug conflict onto the slug', async () => {
    mocks.updateShow.mockResolvedValueOnce({ ok: false, error: 'invalid', issues: [{ path: 'year', message: 'Year is out of range' }] })
    renderEdit()
    await userEvent.type(screen.getByLabelText('Duration'), '0')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Year is out of range')).toBeInTheDocument()

    mocks.updateShow.mockResolvedValueOnce({ ok: false, error: 'conflict' })
    fireEvent.click(screen.getByRole('button', { name: 'Edit URL' }))
    const slug = screen.getByLabelText('URL')
    await userEvent.clear(slug)
    await userEvent.type(slug, 'taken-slug')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('That URL is already used by another show.')).toBeInTheDocument()
    expect(mocks.updateShow.mock.calls[1][0]).toMatchObject({ slug: 'taken-slug' })
  })

  it('create mode: createShow, then opens the new show by data.id', async () => {
    mocks.createShow.mockResolvedValue({ ok: true, data: { id: 42, slug: 'new', title: 'New', featured: false, updatedAt: LOADED } })
    render(<ShowForm mode="create" allTags={TAGS} />)
    expect(screen.queryByLabelText('URL')).not.toBeInTheDocument()
    await userEvent.type(screen.getByLabelText(/Title/), 'New')
    fireEvent.click(screen.getByRole('button', { name: 'Add Show' }))
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/admin/shows/42'))
    expect(mocks.createShow.mock.calls[0][0]).toMatchObject({ title: 'New', difficulty: 'Intermediate' })
  })

  // #70: the thumbnail picked on the new-show form must be saved on the new show.
  const createWithThumbnail = async () => {
    mocks.createShow.mockResolvedValue({ ok: true, data: { id: 42, slug: 'new', title: 'New', featured: false, updatedAt: LOADED } })
    render(<ShowForm mode="create" allTags={TAGS} />)
    await userEvent.type(screen.getByLabelText(/Title/), 'New')
    const poster = new File(['png'], 'poster.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('Upload thumbnail'), { target: { files: [poster] } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Show' }))
    return poster
  }

  it('create mode with a thumbnail: createShow, upload to data.id, setShowThumbnail, then opens the show', async () => {
    mocks.uploadFileDirect.mockResolvedValue({ id: 9 })
    mocks.setShowThumbnail.mockResolvedValue({ ok: true, data: { updatedAt: LOADED, thumbnailUrl: 'https://cdn/poster.png' } })
    const poster = await createWithThumbnail()
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/admin/shows/42'))
    expect(mocks.uploadFileDirect).toHaveBeenCalledWith(expect.objectContaining({ file: poster, fileType: 'image', showId: 42 }))
    expect(mocks.setShowThumbnail).toHaveBeenCalledWith({ showId: 42, fileId: 9 })
    expect(mocks.createShow.mock.invocationCallOrder[0]).toBeLessThan(mocks.uploadFileDirect.mock.invocationCallOrder[0])
    expect(mocks.uploadFileDirect.mock.invocationCallOrder[0]).toBeLessThan(mocks.setShowThumbnail.mock.invocationCallOrder[0])
  })

  it('create mode: a failed thumbnail save is reported, not hidden', async () => {
    mocks.uploadFileDirect.mockResolvedValue({ id: 9 })
    mocks.setShowThumbnail.mockResolvedValue({ ok: false, error: 'failed' })
    await createWithThumbnail()
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/admin/shows/42?thumbnail=failed'))

    mocks.push.mockReset()
    mocks.setShowThumbnail.mockReset()
    mocks.uploadFileDirect.mockRejectedValue(new Error('Storage upload failed'))
    cleanup()
    await createWithThumbnail()
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/admin/shows/42?thumbnail=failed'))
    expect(mocks.setShowThumbnail).not.toHaveBeenCalled()
  })
})
