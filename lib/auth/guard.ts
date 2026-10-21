import { NextResponse } from 'next/server'
import { resolveAuthorization } from './authorization'
import { getUserRole, type AdminRole, type UserPermissions } from './roles'

/**
 * Single authorization gate. `authorize()` is the decision; `guard()` adapts
 * it for API route handlers, `requireAdminPage()` (./page-guard.ts) for admin
 * pages, and `guarded()` (lib/actions/_guarded.ts) for Server Actions.
 *
 * Every write route used to hand-roll this: a lazy Supabase import, a session
 * lookup, and — in most cases — no permission check at all, which meant any
 * authenticated account could mutate the catalogue. Routes now call this and
 * return `denied` verbatim when present.
 *
 *   const gate = await guard('canManageShows')
 *   if (gate.denied) return gate.denied
 *   // gate.email is a verified address with a row in admin_users;
 *   // gate.role is that row's role
 *
 * The role is read from `admin_users` on every call (per-request dedupe only),
 * so removing someone takes effect on their next request.
 */
/**
 * Who is calling and whether they may do `permission`, with no transport
 * attached. `unavailable` is an outage (auth provider or role lookup failed):
 * never a pass, and never reported as a denial either.
 */
export type Authorization =
  | { status: 'authorized'; email: string; role: AdminRole }
  | { status: 'unauthenticated' | 'forbidden' | 'unavailable' }

export async function authorize(permission: keyof UserPermissions): Promise<Authorization> {
  let createClient: typeof import('@/lib/utils/supabase/server').createClient
  try {
    ;({ createClient } = await import('@/lib/utils/supabase/server'))
  } catch (error) {
    console.error('Supabase client import failed.', error)
    return { status: 'unavailable' }
  }

  // getUser revalidates against the auth server; getSession trusts the cookie.
  // Failing closed here is deliberate: an identity we cannot establish must
  // never fall through to the caller.
  let email: string | undefined
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error) return { status: 'unauthenticated' }
    email = data?.user?.email
  } catch (error) {
    console.error('Auth lookup failed.', error)
    return { status: 'unauthenticated' }
  }
  if (!email) return { status: 'unauthenticated' }

  // A lookup that fails (not "no row": an error) is an outage, never a pass.
  let role: AdminRole | null
  try {
    role = await getUserRole(email)
  } catch (error) {
    console.error('Admin role lookup failed.', error)
    return { status: 'unavailable' }
  }

  const result = resolveAuthorization(email, role, permission)
  if (result.status !== 'authorized') return { status: result.status }
  return { status: 'authorized', email: result.email, role: result.role }
}

export type GuardResult =
  | { denied: NextResponse; email?: undefined; role?: undefined }
  | { denied: null; email: string; role: AdminRole }

const DENIALS = {
  unauthenticated: { error: 'Unauthorized', status: 401 },
  forbidden: { error: 'Forbidden', status: 403 },
  unavailable: { error: 'Authorization unavailable', status: 500 },
} as const

/** authorize() as a route handler's answer: 401, 403 or 500 in `denied`. */
export async function guard(permission: keyof UserPermissions): Promise<GuardResult> {
  const result = await authorize(permission)
  if (result.status === 'authorized') return { denied: null, email: result.email, role: result.role }
  const { error, status } = DENIALS[result.status]
  return { denied: NextResponse.json({ error }, { status }) }
}
