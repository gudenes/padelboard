// src/lib/supabase-server.ts — Server-only Supabase clients (uses next/headers).
// Do NOT import from client components.

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

type CookieToSet = { name: string; value: string; options?: CookieOptions }

export async function serverSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list: CookieToSet[]) => {
          try {
            list.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // `cookies()` is read-only in Server Components; safe to ignore.
          }
        },
      },
    },
  )
}

export function serviceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
