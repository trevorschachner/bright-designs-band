import { createBrowserClient } from "@supabase/ssr";

const envSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseUrl = (envSupabaseUrl && envSupabaseUrl !== '****') ? envSupabaseUrl : null;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Track if we've already shown the warning to avoid console spam
let hasShownClientWarning = false;

export const createClient = () => {
  // If env vars are missing, return a lightweight mock that behaves as "no session"
  if (!supabaseUrl || !supabaseKey) {
    if (process.env.NODE_ENV !== "production" && !hasShownClientWarning) {
      console.warn(
        "Supabase env vars are not set (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). Client will treat all requests as unauthenticated."
      );
      hasShownClientWarning = true;
    }

    const supabaseMock = {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithOAuth: async () => ({ data: null, error: new Error("Supabase not configured") }),
        signInWithOtp: async () => ({ data: null, error: new Error("Supabase not configured") }),
        signInWithPassword: async () => ({ data: null, error: new Error("Supabase not configured") }),
        signUp: async () => ({ data: null, error: new Error("Supabase not configured") }),
        signOut: async () => ({ error: null }),
        resend: async () => ({ data: null, error: new Error("Supabase not configured") }),
        verifyOtp: async () => ({ data: null, error: new Error("Supabase not configured") }),
      },
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: new Error("Supabase not configured") }),
        update: () => ({ data: null, error: new Error("Supabase not configured") }),
        delete: () => ({ data: null, error: new Error("Supabase not configured") }),
      }),
    } as any;

    return supabaseMock;
  }

  return createBrowserClient(supabaseUrl!, supabaseKey!);
}; 