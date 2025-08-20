import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Track if we've already shown the warning to avoid console spam
let hasShownWarning = false;

export const createClient = (request: NextRequest) => {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // If env vars are missing, return a lightweight mock that behaves as "no session"
  if (!supabaseUrl || !supabaseKey) {
    if (process.env.NODE_ENV !== "production" && !hasShownWarning) {
      console.warn(
        "Supabase env vars are not set (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). Middleware will treat all requests as unauthenticated."
      );
      hasShownWarning = true;
    }

    const supabaseMock = {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
      },
    } as unknown as ReturnType<typeof createServerClient>;

    return { supabase: supabaseMock, response: supabaseResponse };
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => 
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  return { supabase, response: supabaseResponse };
}; 