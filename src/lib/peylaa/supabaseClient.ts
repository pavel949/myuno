/**
 * PEYLAA Supabase Client
 * Separate Supabase project for the PEYLAA sales system
 */
import { createClient } from '@supabase/supabase-js';

const PEYLAA_SUPABASE_URL = 'https://bhmvnorkswapjkmbvykk.supabase.co';
const PEYLAA_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJobXZub3Jrc3dhcGprbWJ2eWtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NzUxNjIsImV4cCI6MjA5MTA1MTE2Mn0.KrXs10Mj2aRaDql8xXDqa5cgyfSlkuehT1JfP4SiU_A';

export const peylaaDb = createClient(PEYLAA_SUPABASE_URL, PEYLAA_SUPABASE_KEY, {
  auth: {
    persistSession: false, // No auth needed for public read
  },
});
