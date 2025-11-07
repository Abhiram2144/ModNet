import { createClient } from '@supabase/supabase-js';
import { config } from '../config/config.js';

// Create Supabase client with service role for admin operations
export const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey
);

// Create Supabase client with anon key for user-level operations
export const supabaseAnon = createClient(
  config.supabase.url,
  config.supabase.anonKey
);
