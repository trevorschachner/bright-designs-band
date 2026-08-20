/**
 * Stand-in Supabase client used when the env vars are missing or masked.
 *
 * Extracted so it can be tested. It is handed back through an
 * `as unknown as SupabaseClient` cast, which means the compiler cannot tell a
 * caller that a method is absent — a getSession-only mock turned clean 401s
 * into unhandled 500s the moment a caller reached for getUser. Anything the
 * app calls on the real client belongs here too, resolving signed-out.
 */
export function createSupabaseMock() {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
    },
  }
}
