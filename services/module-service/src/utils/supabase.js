import { createClient } from '@supabase/supabase-js';
import { config } from '../config/config.js';

export const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey
);

export const supabaseAnon = createClient(
  config.supabase.url,
  config.supabase.anonKey
);
