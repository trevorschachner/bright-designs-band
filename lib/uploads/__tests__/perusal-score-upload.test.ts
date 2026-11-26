import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  signUpload: vi.fn(),
  completeUpload: vi.fn(),
  setPerusalScore: vi.fn(),
  deleteFile: vi.fn(),
}))
vi.mock('@/lib/actions/uploads', () => ({ signUpload: mocks.signUpload, completeUpload: mocks.completeUpload }))
vi.mock('@/lib/actions/files', () => ({ setPerusalScore: mocks.setPerusalScore, deleteFile: mocks.deleteFile }))

import { uploadPerusalScore } from '@/lib/uploads/direct-upload'

const pdf = new File(['%PDF-1.7'], 'Opener.pdf', { type: 'application/pdf' })
const SET = { arrangementId: 9, file: { id: 41, originalName: 'Opener.pdf', createdAt: '2026-11-26T15:00:00.000Z' }, previousRemoved: true }

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset()
  mocks.signUpload.mockResolvedValue({ ok: true, data: { pendingId: 'p', signedUrl: 'https://storage/x', token: 't', path: 'files/x.pdf', bucket: 'private' } })
  mocks.completeUpload.mockResolvedValue({ ok: true, data: { id: 41, url: '/api/files/41/download', showId: 7, arrangementId: 9 } })
  mocks.setPerusalScore.mockResolvedValue({ ok: true, data: SET })
  mocks.deleteFile.mockResolvedValue({ ok: true, data: { id: 41, show: null } })
  vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 200 })))
})

describe('uploadPerusalScore', () => {
  it('uploads a private score, then points the slot at it', async () => {
    expect(await uploadPerusalScore({ file: pdf, showId: 7, arrangementId: 9 })).toEqual(SET)
    expect(mocks.signUpload).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'score', isPublic: false, showId: 7, arrangementId: 9, mimeType: 'application/pdf' })
    )
    expect(mocks.setPerusalScore).toHaveBeenCalledWith({ arrangementId: 9, fileId: 41 })
    expect(mocks.deleteFile).not.toHaveBeenCalled()
  })

  it('deletes the new upload again when the slot cannot be set', async () => {
    mocks.setPerusalScore.mockResolvedValue({ ok: false, error: 'invalid', issues: [{ path: 'fileId', message: 'A perusal score must be a private PDF score' }] })
    await expect(uploadPerusalScore({ file: pdf, showId: 7, arrangementId: 9 })).rejects.toThrow('A perusal score must be a private PDF score')
    expect(mocks.deleteFile).toHaveBeenCalledWith({ id: 41 })
  })

  it('refuses a file that is not a PDF before signing anything', async () => {
    const png = new File(['x'], 'a.png', { type: 'image/png' })
    await expect(uploadPerusalScore({ file: png, showId: 7, arrangementId: 9 })).rejects.toThrow('PDF')
    expect(mocks.signUpload).not.toHaveBeenCalled()
  })
})
