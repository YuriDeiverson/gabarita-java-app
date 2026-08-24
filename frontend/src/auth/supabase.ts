import { createClient } from '@supabase/supabase-js';
import { expireInactiveSessionBeforeClientCreation } from './inactivity';

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const supabaseKey = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '');

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

// An abandoned persisted session must be discarded before Supabase starts its
// automatic recovery, otherwise an expired token can hold the initial screen
// while the browser waits for a refresh request.
expireInactiveSessionBeforeClientCreation();

export const supabase = createClient(
  supabaseUrl || 'http://127.0.0.1:54321',
  supabaseKey || 'supabase-not-configured',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
