import { NextResponse } from 'next/server'
import { resolveAuthorization } from './authorization'
import type { UserPermissions } from './roles'

/**
 * Single authorization gate for API route handlers.
 *
 * Every write route used to hand-roll this: a lazy Supabase import, a session
 * lookup, and — in most cases — no permission check at all, which meant any
 * authenticated account could mutate the catalogue. Routes now call this and
 * return `denied` verbatim when present.
 *
 *   const gate = await guard('canManageShows')
 *   if (gate.denied) return gate.denied
 *   // gate.email is a verified, permitted staff address
 */
export type GuardResult =
  | { denied: NextResponse; email?: undefined }
  | { denied: null; email: string }

export async function guard(permission: keyof UserPermissions): Promise<GuardResult> {
  let createClient: typeof import('@/lib/utils/supabase/server').createClient
  try {
    ;({ createClient } = await import('@/lib/utils/supabase/server'))
  } catch (error) {
    console.error('Supabase client import failed.', error)
    return {
      denied: NextResponse.json({ error: 'Auth provider not configured' }, { status: 500 }),
    }
  }

  // getUser revalidates against the auth server; getSession trusts the cookie.
  // The routes were split between the two, so standardise on the safer one.
  // Failing closed here is deliberate: an identity we cannot establish must
  // never fall through to the handler.
  let email: string | undefined
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      return { denied: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
    }
    email = data?.user?.email
  } catch (error) {
    console.error('Auth lookup failed.', error)
    return { denied: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const result = resolveAuthorization(email, permission)
  if (result.status === 'unauthenticated') {
    return { denied: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if (result.status === 'forbidden') {
    return { denied: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { denied: null, email: result.email }
}
