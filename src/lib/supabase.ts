import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://mgtbeiqqehvnrudlebio.supabase.co';
// Using the provided Anon Key
const SUPABASE_ANON_KEY = 'sb_publishable_5I5otxiF4C5rA195oSxNqA_jft4qlZf';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
