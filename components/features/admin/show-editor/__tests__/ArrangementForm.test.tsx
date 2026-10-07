import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { EditableArrangement } from '@/lib/services/admin'

const mocks = vi.hoisted(() => ({ createArrangement: vi.fn(), updateArrangement: vi.fn() }))
vi.mock('@/lib/actions/arrangements', () => mocks)

import { ArrangementForm } from '@/components/features/admin/show-editor/ArrangementForm'

const LOADED = '2026-10-07T12:00:00.000Z'
const PART: EditableArrangement = {
  id: 11,
  title: 'Part 1',
  composer: null,
  arranger: 'Brighton Barrineau',
  percussionArranger: null,
  description: null,
  grade: '3_4',
  scene: 'Opener',
  ensembleSize: null,
  year: 2025,
  durationSeconds: 270,
  youtubeUrl: null,
  commissioned: null,
  sampleScoreUrl: null,
  orderIndex: 1,
  updatedAt: LOADED,
  tagIds: [],
  pieces: [],
}
const TAGS = [{ id: 2, name: 'Small Band' }]

beforeEach(() => {
  mocks.createArrangement.mockReset()
  mocks.updateArrangement.mockReset()
})

describe('ArrangementForm', () => {
  it('add: requires a title, defaults the arranger and the show’s percussion credit, sends camelCase', async () => {
    const onSaved = vi.fn()
    mocks.createArrangement.mockResolvedValue({ ok: true, data: { id: 14, title: 'Closer', updatedAt: LOADED } })
    render(<ArrangementForm showId={7} showPercussionArranger="Ryan Wilhite" allTags={TAGS} onSaved={onSaved} onCancel={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add Arrangement' }))
    expect(await screen.findByText('Title is required')).toBeInTheDocument()
    expect(mocks.createArrangement).not.toHaveBeenCalled()

    expect(screen.getByLabelText('Music Arranger')).toHaveValue('Brighton Barrineau, Trevor Schachner')
    expect(screen.getByLabelText('Percussion Arranger')).toHaveValue('Ryan Wilhite')
    await userEvent.type(screen.getByLabelText(/Title/), 'Closer')
    await userEvent.type(screen.getByLabelText('Duration (mm:ss)'), '4:30')
    await userEvent.selectOptions(screen.getByLabelText('Scene'), 'Closer')
    fireEvent.click(screen.getByLabelText('Small Band'))
    fireEvent.click(screen.getByRole('button', { name: 'Add Arrangement' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(mocks.createArrangement).toHaveBeenCalledWith(
      expect.objectContaining({
        showId: 7,
        title: 'Closer',
        durationSeconds: 270,
        scene: 'Closer',
        grade: null,
        percussionArranger: 'Ryan Wilhite',
        tags: [2],
      })
    )
  })

  it('rejects a duration that is not mm:ss', async () => {
    render(<ArrangementForm showId={7} allTags={TAGS} onSaved={vi.fn()} onCancel={vi.fn()} />)
    await userEvent.type(screen.getByLabelText(/Title/), 'X')
    await userEvent.type(screen.getByLabelText('Duration (mm:ss)'), 'soon')
    fireEvent.click(screen.getByRole('button', { name: 'Add Arrangement' }))
    expect(await screen.findByText('Duration must be mm:ss, e.g. 4:30')).toBeInTheDocument()
  })

  it('edit: loads the part, saves with its updatedAt, shows the stale alert', async () => {
    mocks.updateArrangement.mockResolvedValue({ ok: false, error: 'stale' })
    render(<ArrangementForm showId={7} arrangement={PART} allTags={TAGS} onSaved={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByLabelText('Duration (mm:ss)')).toHaveValue('4:30')
    expect(screen.getByLabelText('Grade')).toHaveValue('3_4')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('This part was changed by someone else. Reload to see their changes.')).toBeInTheDocument()
    expect(mocks.updateArrangement).toHaveBeenCalledWith(expect.objectContaining({ id: 11, updatedAt: LOADED, title: 'Part 1' }))
  })

  it('maps a durationSeconds issue onto the duration field', async () => {
    mocks.updateArrangement.mockResolvedValue({
      ok: false,
      error: 'invalid',
      issues: [{ path: 'durationSeconds', message: 'Duration is over an hour' }],
    })
    render(<ArrangementForm showId={7} arrangement={PART} allTags={TAGS} onSaved={vi.fn()} onCancel={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Duration is over an hour')).toBeInTheDocument()
  })
})
