import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { serverSupabase, serviceSupabase } from "@/lib/supabase-server";
import { locales } from "@/i18n/routing";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cookieStore = await cookies();
  const code = url.searchParams.get("code");
  const candidate =
    url.searchParams.get("match") ||
    cookieStore.get("padelboard_pending_match")?.value;
  const matchId =
    candidate &&
    /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(candidate)
      ? candidate
      : null;
  const remote = url.searchParams.get("mode") === "remote" && !!matchId;
  const failure = () =>
    NextResponse.redirect(
      `${url.origin}/login?auth_error=expired${matchId ? `&match=${matchId}${remote ? "&mode=remote" : ""}` : ""}`,
    );
  if (url.searchParams.has("error")) return failure();
  const sb = await serverSupabase();
  if (code) {
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) return failure();
  }
  const { data: userRes } = await sb.auth.getUser();
  if (!userRes.user) return failure();
  const profileLocale = userRes.user.user_metadata?.padelboard_profile?.locale;
  const preferred = locales.includes(profileLocale) ? profileLocale : null;
  /**
   * Aplica a preferência de língua aqui, e não no proxy.ts: ler o perfil no
   * middleware obrigaria a autenticar contra o Supabase em cada pedido de UI.
   * Os caminhos abaixo continuam sem prefixo — o proxy prefixa-os a partir
   * deste cookie.
   */
  const go = (path: string) => {
    const res = NextResponse.redirect(`${url.origin}${path}`);
    // Mesmos atributos que o next-intl usa ao escrever este cookie
    // (localeCookie: { name: "NEXT_LOCALE", sameSite: "lax" }), para que os
    // dois escritores não produzam cookies com comportamentos diferentes.
    if (preferred)
      res.cookies.set("NEXT_LOCALE", preferred, {
        path: "/",
        sameSite: "lax",
      });
    return res;
  };
  if (!remote && !userRes.user.user_metadata?.padelboard_profile?.completed)
    return go(`/welcome${matchId ? `?match=${matchId}` : ""}`);
  if (!matchId) return go("/dashboard");
  const svc = serviceSupabase();
  const { data } = await svc
    .from("matches")
    .select("short_code")
    .eq("id", matchId)
    .single();
  if (!data?.short_code) return go("/dashboard");
  const response = go(`/m/${data.short_code}${remote ? "/remote" : ""}`);
  response.cookies.delete("padelboard_pending_match");
  return response;
}
