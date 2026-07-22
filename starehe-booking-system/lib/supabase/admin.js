// lib/supabase/admin.js
// SERVER-ONLY client using the service role key. This bypasses Row Level Security.
// Never import this file from a Client Component or expose SUPABASE_SERVICE_ROLE_KEY to the browser.
// Use for: sending emails after approval, admin dashboard writes, cross-table inventory updates.

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
