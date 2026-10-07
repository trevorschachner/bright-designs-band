import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { EditableArrangement } from '@/lib/services/admin'

const mocks = vi.hoisted(() => ({
  deleteArrangement: vi.fn(),
  reorderArrangements: vi.fn(),
  refresh: vi.fn(),
}))
vi.mock('@/lib/actions/arrangements', () => ({
  deleteArrangement: mocks.deleteArrangement,
  reorderArrangements: mocks.reorderArrangements,
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }))
vi.mock('@/components/features/admin/show-editor/ArrangementForm', () => ({ ArrangementForm: () => <div>form</div> }))
vi.mock('@/components/features/admin/show-editor/FilesPanel', () => ({ FilesPanel: () => null }))
vi.mock('@/components/features/admin/show-editor/PiecesPanel', () => ({ PiecesPanel: () => null }))

import { ArrangementsPanel } from '@/components/features/admin/show-editor/ArrangementsPanel'

const part = (id: number, title: string, orderIndex: number): EditableArrangement => ({
  id,
  title,
  composer: null,
  arranger: null,
  percussionArranger: null,
  description: null,
  grade: null,
  scene: null,
  ensembleSize: null,
  year: null,
  durationSeconds: null,
  youtubeUrl: null,
  commissioned: null,
  sampleScoreUrl: null,
  orderIndex,
  updatedAt: '2026-10-07T12:00:00.000Z',
  tagIds: [],
  pieces: [],
})

beforeEach(() => {
  mocks.deleteArrangement.mockReset()
  mocks.reorderArrangements.mockReset()
  mocks.refresh.mockReset()
})

describe('ArrangementsPanel', () => {
  it('disables Edit and Delete while a write and its refresh are pending', async () => {
    let finish!: (v: unknown) => void
    mocks.reorderArrangements.mockReturnValue(new Promise(r => (finish = r)))
    render(
      <ArrangementsPanel
        showId={7}
        showPercussionArranger={null}
        arrangements={[part(1, 'Opener', 1), part(2, 'Ballad', 2)]}
        files={[]}
        allTags={[]}
        allPieces={[]}
        onShowStamp={vi.fn()}
      />
    )
    const edits = () => screen.getAllByRole('button', { name: 'Edit' })
    const deletes = () => screen.getAllByRole('button', { name: 'Delete' })
    for (const b of [...edits(), ...deletes()]) expect(b).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'Move Ballad up' }))
    await waitFor(() => expectAllDisabled([...edits(), ...deletes()]))

    await act(async () => finish({ ok: true, data: null }))
    await waitFor(() => {
      for (const b of [...edits(), ...deletes()]) expect(b).toBeEnabled()
    })
    expect(mocks.refresh).toHaveBeenCalled()
  })
})

function expectAllDisabled(buttons: HTMLElement[]) {
  for (const b of buttons) expect(b).toBeDisabled()
}
