import { createClient } from '@supabase/supabase-js'
import { getSupabaseConfig } from '@/lib/env'

const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig()
const resolvedSupabaseUrl = supabaseUrl ?? 'https://yibokqolsyxosftcupgz.supabase.co'

if (!supabaseKey) {
  throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

const supabase = createClient(resolvedSupabaseUrl, supabaseKey)

export default supabase 