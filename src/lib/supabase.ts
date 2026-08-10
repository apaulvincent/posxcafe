import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getStoragePathFromUrl = (url: string | undefined): string | null => {
  if (!url || !url.includes('/public/images/')) return null;
  return url.split('/public/images/')[1];
};
