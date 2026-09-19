import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { serverSupabase, serviceSupabase } from "@/lib/supabase-server";

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
  if (!remote && !userRes.user.user_metadata?.padelboard_profile?.completed)
    return NextResponse.redirect(
      `${url.origin}/welcome${matchId ? `?match=${matchId}` : ""}`,
    );
  if (!matchId) return NextResponse.redirect(`${url.origin}/dashboard`);
  const svc = serviceSupabase();
  const { data } = await svc
    .from("matches")
    .select("short_code")
    .eq("id", matchId)
    .single();
  if (!data?.short_code)
    return NextResponse.redirect(`${url.origin}/dashboard`);
  const response = NextResponse.redirect(`${url.origin}/m/${data.short_code}${remote ? "/remote" : ""}`);
  response.cookies.delete("padelboard_pending_match");
  return response;
}
