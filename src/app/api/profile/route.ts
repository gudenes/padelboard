import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase-server";
import { parsePlayerProfile } from "@/lib/player-profile";
export async function POST(req: Request) {
  const sb = await serverSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  let profile;
  try {
    profile = parsePlayerProfile(await req.json());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "profile_invalid" },
      { status: 400 },
    );
  }
  const { error } = await sb
    .from("profiles")
    .upsert({ id: user.id, name: profile.name, role: profile.role });
  if (error)
    return NextResponse.json({ error: "profile_save_failed" }, { status: 500 });
  const { error: metadataError } = await sb.auth.updateUser({
    data: {
      name: profile.name,
      padelboard_profile: { ...profile, completed: true },
    },
  });
  if (metadataError)
    return NextResponse.json({ error: "avatar_save_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
