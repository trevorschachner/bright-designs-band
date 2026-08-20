import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "@/lib/env";
import { createSupabaseMock } from "./mock-client";

const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig();

export const createClient = async () => {
  const cookieStore = await cookies();

  if (!supabaseUrl || !supabaseKey || supabaseUrl === '****') {
    if (process.env.NODE_ENV !== "production" || supabaseUrl === '****') {
      console.warn(
        "Supabase env vars are not set or invalid (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). Using a mock client."
      );
    }

    return createSupabaseMock() as unknown as ReturnType<typeof createServerClient>;
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