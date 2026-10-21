import { beforeEach, describe, expect, it, vi } from 'vitest'

const m = vi.hoisted(() => ({
  authorize: vi.fn(),
  redirect: vi.fn((to: string) => {
    throw new Error(`redirect:${to}`)
  }),
}))
vi.mock('@/lib/auth/guard', () => ({ authorize: m.authorize }))
vi.mock('next/navigation', () => ({ redirect: m.redirect }))

import { requireAdminPage } from '@/lib/auth/page-guard'

beforeEach(() => {
  m.authorize.mockReset()
  m.redirect.mockClear()
})

describe('requireAdminPage', () => {
  it('returns who is calling when authorized', async () => {
    m.authorize.mockResolvedValue({ status: 'authorized', email: 'a@b.c', role: 'owner' })
    await expect(requireAdminPage('canManageUsers')).resolves.toEqual({ email: 'a@b.c', role: 'owner' })
    expect(m.authorize).toHaveBeenCalledWith('canManageUsers')
  })

  it('sends a signed-out caller to /login', async () => {
    m.authorize.mockResolvedValue({ status: 'unauthenticated' })
    await expect(requireAdminPage('canManageTags')).rejects.toThrow('redirect:/login')
  })

  it('sends a caller without the permission to / or the given page', async () => {
    m.authorize.mockResolvedValue({ status: 'forbidden' })
    await expect(requireAdminPage('canManageTags')).rejects.toThrow('redirect:/')
    await expect(requireAdminPage('canManageUsers', '/admin')).rejects.toThrow('redirect:/admin')
  })

  it('throws on an outage instead of redirecting', async () => {
    m.authorize.mockResolvedValue({ status: 'unavailable' })
    await expect(requireAdminPage('canAccessAdmin')).rejects.toThrow('Authorization unavailable')
    expect(m.redirect).not.toHaveBeenCalled()
  })
})
