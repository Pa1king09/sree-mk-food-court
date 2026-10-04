import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://vjdonfhdlzexzycejoyj.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZG9uZmhkbHpleHp5Y2Vqb3lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNTcwMTUsImV4cCI6MjEwNjYzMzAxNX0.aQvd6n5gTcH3bIvQuSxNFFinhzAUE3YoSMeBT1HU_Ks';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-supabase-anon-public-key')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;
