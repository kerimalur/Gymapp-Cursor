import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client - will be valid only if env vars are set
// During build time or without env vars, this will be a dummy client
let supabaseClient: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.warn('Failed to initialize Supabase client', error);
  }
}

// Export a safe client that won't crash if not initialized
export const supabase = supabaseClient || {
  auth: {
    getUser: async () => ({ data: { user: null }, error: new Error('Supabase not initialized') }),
    getSession: async () => ({ data: { session: null }, error: new Error('Supabase not initialized') }),
    signInWithOAuth: async () => ({ data: null, error: new Error('Supabase not initialized') }),
    signOut: async () => ({ error: new Error('Supabase not initialized') }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => ({
    select: () => ({ eq: () => ({ data: null, error: new Error('Supabase not initialized') }) }),
    insert: () => ({ select: () => ({ single: async () => ({ data: null, error: new Error('Supabase not initialized') }) }) }),
    update: () => ({ eq: () => ({ data: null, error: new Error('Supabase not initialized') }) }),
    delete: () => ({ eq: () => ({ data: null, error: new Error('Supabase not initialized') }) }),
  }),
} as any;

// Auth helper
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
