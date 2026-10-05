import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readPublicEnv } from '../config/env';

export function createSupabaseClient(): SupabaseClient {
  const env = readPublicEnv();
  return createClient(env.supabaseUrl, env.supabasePublishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
