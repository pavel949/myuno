/**
 * PEYLAA Supabase Client
 * Separate Supabase project for the PEYLAA sales system
 */
import { createClient } from '@supabase/supabase-js';

const PEYLAA_SUPABASE_URL = import.meta.env.VITE_PEYLAA_SUPABASE_URL as string;
const PEYLAA_SUPABASE_KEY = import.meta.env.VITE_PEYLAA_SUPABASE_KEY as string;

export const peylaaDb = createClient(PEYLAA_SUPABASE_URL, PEYLAA_SUPABASE_KEY, {
  auth: {
    persistSession: false, // No auth needed for public read
  },
});
