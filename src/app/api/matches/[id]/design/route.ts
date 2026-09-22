import { NextResponse } from "next/server";
import { serverSupabase, serviceSupabase } from "@/lib/supabase-server";
import { parseBoardEdit } from "@/lib/board-edit";
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sb = await serverSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  const { id } = await params;
  let edit;
  try {
    edit = parseBoardEdit(await req.json());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "design_invalid" },
      { status: 400 },
    );
  }
  const svc = serviceSupabase();
  // Retry on a simultaneous score update, always merging the newest clock/history.
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: row } = await svc
      .from("matches")
      .select("*")
      .eq("id", id)
      .eq("owner_id", user.id)
      .single();
    if (!row)
      return NextResponse.json({ error: "match_not_found" }, { status: 404 });
    const overlay = {
      ...row.overlay,
      ...edit,
      customColors: { ...row.overlay.customColors, ...edit.customColors },
    };
    const { data, error } = await svc
      .from("matches")
      .update({ overlay })
      .eq("id", id)
      .eq("owner_id", user.id)
      .eq("updated_at", row.updated_at)
      .select("*")
      .maybeSingle();
    if (error)
      return NextResponse.json(
        { error: "design_save_failed" },
        { status: 500 },
      );
    if (data) return NextResponse.json({ row: { ...data, draft_token: null } });
  }
  return NextResponse.json({ error: "design_save_conflict" }, { status: 409 });
}
