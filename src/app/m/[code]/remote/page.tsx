import { notFound, redirect } from "next/navigation";
import { serviceSupabase, serverSupabase } from "@/lib/supabase-server";
import type { MatchRow } from "@/types/match";
import { Operator } from "../Operator";

export const dynamic = "force-dynamic";

export default async function RemotePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { data } = await serviceSupabase().from("matches").select("*").eq("short_code", code).single();
  if (!data || data.status === "draft") return notFound();
  const { data: { user } } = await (await serverSupabase()).auth.getUser();
  if (!user) redirect(`/login?match=${data.id}&mode=remote`);
  if (user.id !== data.owner_id) return notFound();
  return <Operator initial={{ ...data, draft_token: null } as unknown as MatchRow} phone />;
}
