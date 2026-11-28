import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  uploadPerusalScore: vi.fn(),
  refresh: vi.fn(),
}))
vi.mock('@/lib/uploads/direct-upload', () => ({ uploadPerusalScore: mocks.uploadPerusalScore }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }))

import { PerusalScoreSlot } from '@/components/features/admin/show-editor/PerusalScoreSlot'

const SCORE = { id: 41, originalName: 'Opener full score.pdf', createdAt: '2026-11-26T15:00:00.000Z' }
const pdf = new File(['%PDF-1.7'], 'New score.pdf', { type: 'application/pdf' })

const choose = (file: File) => fireEvent.change(screen.getByLabelText('Perusal score PDF for part 9'), { target: { files: [file] } })

beforeEach(() => {
  mocks.uploadPerusalScore.mockReset()
  mocks.refresh.mockReset()
})

describe('PerusalScoreSlot', () => {
  it('an empty slot offers an upload', () => {
    render(<PerusalScoreSlot showId={7} arrangementId={9} score={null} />)
    expect(screen.getByText('No perusal score yet.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload PDF' })).toBeEnabled()
  })

  it('shows the current file, its date and a staff download link, and offers Replace', () => {
    render(<PerusalScoreSlot showId={7} arrangementId={9} score={SCORE} />)
    expect(screen.getByRole('link', { name: 'Opener full score.pdf' })).toHaveAttribute('href', '/api/files/41/download')
    expect(screen.getByText('Nov 26, 2026')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Replace' })).toBeInTheDocument()
  })

  it('uploads the chosen PDF into the slot and re-reads the editor', async () => {
    mocks.uploadPerusalScore.mockResolvedValue({ arrangementId: 9, file: { ...SCORE, id: 42 }, previousRemoved: true })
    render(<PerusalScoreSlot showId={7} arrangementId={9} score={SCORE} />)
    choose(pdf)
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled())
    expect(mocks.uploadPerusalScore).toHaveBeenCalledWith(expect.objectContaining({ file: pdf, showId: 7, arrangementId: 9 }))
  })

  it('says so when the old score could not be removed', async () => {
    mocks.uploadPerusalScore.mockResolvedValue({ arrangementId: 9, file: { ...SCORE, id: 42 }, previousRemoved: false })
    render(<PerusalScoreSlot showId={7} arrangementId={9} score={SCORE} />)
    choose(pdf)
    expect(await screen.findByText(/old score could not be removed/)).toBeInTheDocument()
  })

  it('refuses a file that is not a PDF without uploading', async () => {
    render(<PerusalScoreSlot showId={7} arrangementId={9} score={null} />)
    choose(new File(['x'], 'score.png', { type: 'image/png' }))
    expect(await screen.findByText('Choose a PDF file.')).toBeInTheDocument()
    expect(mocks.uploadPerusalScore).not.toHaveBeenCalled()
  })

  it('shows the upload error', async () => {
    mocks.uploadPerusalScore.mockRejectedValue(new Error('Max file size is 50 MB for score files'))
    render(<PerusalScoreSlot showId={7} arrangementId={9} score={null} />)
    choose(pdf)
    expect(await screen.findByText('Max file size is 50 MB for score files')).toBeInTheDocument()
    expect(mocks.refresh).not.toHaveBeenCalled()
  })
})
