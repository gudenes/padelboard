import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase-server";
import { locales } from "@/i18n/routing";

/**
 * Grava só a preferência de língua, sem tocar no resto do perfil.
 * Existe em separado do POST /api/profile porque esse exige um perfil
 * completo — enviar-lhe apenas { locale } devolveria 400.
 */
export async function POST(req: Request) {
  const sb = await serverSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "sign_in_required" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { locale?: unknown } | null;
  const locale = body?.locale;
  if (!locales.includes(locale as (typeof locales)[number]))
    return NextResponse.json({ error: "locale_unsupported" }, { status: 400 });

  const { error } = await sb.auth.updateUser({
    data: {
      padelboard_profile: {
        ...(user.user_metadata?.padelboard_profile ?? {}),
        locale,
      },
    },
  });
  if (error)
    return NextResponse.json({ error: "locale_save_failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
