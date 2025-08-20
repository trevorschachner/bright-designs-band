import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const createClient = async () => {
  const cookieStore = await cookies();

  if (!supabaseUrl || !supabaseKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "Supabase env vars are not set (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). Using a mock client that returns no session."
      );
    }

    const supabaseMock = {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
      },
    } as unknown as ReturnType<typeof createServerClient>;

    return supabaseMock;
  }

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}; 