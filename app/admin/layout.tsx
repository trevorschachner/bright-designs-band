import type React from 'react'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const fetchCache = 'force-no-store'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

