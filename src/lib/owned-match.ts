import { notFound, redirect } from "next/navigation";
import { serverSupabase } from "./supabase-server";
import type { MatchRow } from "@/types/match";
export async function ownedMatch(code: string): Promise<MatchRow> {
  const sb = await serverSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await sb
    .from("matches")
    .select("*")
    .eq("short_code", code)
    .eq("owner_id", user.id)
    .single();
  if (error || !data) notFound();
  return { ...data, draft_token: null } as MatchRow;
}
