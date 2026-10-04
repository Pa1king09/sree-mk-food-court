import { createClient, SupabaseClient } from '@supabase/supabase-js';

const PROD_SUPABASE_URL = 'https://vjdonfhdlzexzycejoyj.supabase.co';
const PROD_SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZG9uZmhkbHpleHp5Y2Vqb3lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNTcwMTUsImV4cCI6MjEwNjYzMzAxNX0.aQvd6n5gTcH3bIvQuSxNFFinhzAUE3YoSMeBT1HU_Ks';

function resolveSupabaseKey(): string {
  const envKey = (
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  // A genuine Supabase public anon key is either a JWT token (starts with eyJ...) or a modern publishable key (starts with sb_publishable_ / sbp_)
  if (envKey.startsWith('eyJ') || envKey.startsWith('sb_') || envKey.startsWith('sbp_')) {
    return envKey;
  }
  return PROD_SUPABASE_KEY;
}

function resolveSupabaseUrl(): string {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  if (envUrl.startsWith('https://') && !envUrl.includes('your-project-id')) {
    return envUrl;
  }
  return PROD_SUPABASE_URL;
}

const supabaseUrl = resolveSupabaseUrl();
const supabaseAnonKey = resolveSupabaseKey();

export const isSupabaseConfigured = true;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
