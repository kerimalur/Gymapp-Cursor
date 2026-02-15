import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client
// During build time env vars may be missing, so we handle that gracefully
let supabaseClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  } catch (error) {
    console.warn('Failed to initialize Supabase client', error);
  }
}

// Fallback mock for build time (when env vars are not available)
const mockClient = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: new Error('Supabase not initialized') }),
    getSession: async () => ({ data: { session: null }, error: new Error('Supabase not initialized') }),
    signInWithOAuth: async () => ({ data: null, error: new Error('Supabase not initialized') }),
    signOut: async () => ({ error: new Error('Supabase not initialized') }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => ({
    select: () => ({ eq: () => ({ data: null, error: new Error('Supabase not initialized'), single: async () => ({ data: null, error: new Error('Supabase not initialized') }) }) }),
    insert: () => ({ select: () => ({ single: async () => ({ data: null, error: new Error('Supabase not initialized') }) }) }),
    update: () => ({ eq: () => ({ data: null, error: new Error('Supabase not initialized') }) }),
    delete: () => ({ eq: () => ({ data: null, error: new Error('Supabase not initialized') }) }),
    upsert: async () => ({ data: null, error: new Error('Supabase not initialized') }),
  }),
} as unknown as SupabaseClient;

export const supabase: SupabaseClient = supabaseClient || mockClient;

// Check if Supabase is properly initialized
export const isSupabaseReady = !!supabaseClient;

// Auth helpers
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
