import { NextResponse } from "next/server";
import { serverSupabase, serviceSupabase } from "@/lib/supabase-server";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sb = await serverSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Sign in to open your controls." },
      { status: 401 },
    );
  const { draftToken } = await req.json();
  const svc = serviceSupabase();
  const { data: existing } = await svc
    .from("matches")
    .select("owner_id")
    .eq("id", id)
    .single();
  if (existing?.owner_id === user.id) return NextResponse.json({ ok: true });
  if (typeof draftToken !== "string" || !draftToken)
    return NextResponse.json(
      { error: "Open this board in the browser where you created it." },
      { status: 403 },
    );
  const { error: profileError } = await svc
    .from("profiles")
    .upsert(
      {
        id: user.id,
        name: user.user_metadata?.name || user.email?.split("@")[0] || "Player",
        role: "player",
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
  if (profileError)
    return NextResponse.json(
      { error: "Could not save your profile." },
      { status: 500 },
    );
  const { data, error } = await svc
    .from("matches")
    .update({
      owner_id: user.id,
      draft_token: null,
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("draft_token", draftToken)
    .is("owner_id", null)
    .eq("status", "draft")
    .select("id")
    .single();
  if (error || !data)
    return NextResponse.json(
      {
        error:
          "Could not claim this board. Use the browser where you created it.",
      },
      { status: 409 },
    );
  return NextResponse.json({ ok: true });
}
