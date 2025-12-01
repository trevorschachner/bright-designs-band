import { createClient } from '@supabase/supabase-js'

const envSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseUrl = (envSupabaseUrl && envSupabaseUrl !== '****') 
  ? envSupabaseUrl 
  : 'https://yibokqolsyxosftcupgz.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseKey) {
  throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase 