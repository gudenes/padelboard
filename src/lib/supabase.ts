// src/lib/supabase.ts — Browser-safe Supabase client (no server imports).
// For server components / route handlers use @/lib/supabase-server.

import { createBrowserClient } from '@supabase/ssr'

export function browserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
