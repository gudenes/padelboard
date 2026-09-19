// src/app/m/[code]/page.tsx — routes to Wizard (draft) or Operator (published).
import { notFound, redirect } from "next/navigation";
import { serviceSupabase, serverSupabase } from "@/lib/supabase-server";
import type { MatchRow } from "@/types/match";
import { ReadyMatch } from "@/components/workspace/ReadyMatch";
import { Operator } from "./Operator";

export const dynamic = "force-dynamic";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const sb = serviceSupabase();
  const { data } = await sb
    .from("matches")
    .select("*")
    .eq("short_code", code)
    .single();
  if (!data) return notFound();
  const row = { ...data, draft_token: null } as unknown as MatchRow;
  if (row.status === "draft") return <ReadyMatch row={row} />;
  const auth = await serverSupabase();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) redirect(`/login?match=${row.id}`);
  if (user.id !== row.owner_id) return notFound();
  if (!user.user_metadata?.padelboard_profile?.completed)
    redirect(`/welcome?match=${row.id}`);
  return <Operator initial={row} />;
}
