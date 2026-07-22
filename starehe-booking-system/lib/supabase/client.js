// lib/supabase/client.js
// Supabase client for use in Client Components ("use client").
// Safe to import anywhere on the browser side — uses the public anon key only.

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
