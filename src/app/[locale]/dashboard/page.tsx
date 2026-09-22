import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import Link from "next/link";
import { PlayerAvatar } from "@/components/workspace/PlayerAvatar";
import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase-server";
import type { MatchRow } from "@/types/match";
import { MatchHistory } from "@/components/workspace/MatchHistory";
import "@/components/workspace/workspace.css";
export const dynamic = "force-dynamic";
export default async function Dashboard() {
  const sb = await serverSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");
  if (!user.user_metadata?.padelboard_profile?.completed) redirect("/welcome");
  const { data, error } = await sb
    .from("matches")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  const rows = (data ?? []).map((r) => ({
    ...r,
    draft_token: null,
  })) as MatchRow[];
  return (
    <main className="pbw">
      <WorkspaceHeader />
      <div className="pbw-profile-intro" style={{ marginTop: 24 }}>
        <PlayerAvatar
          color={user.user_metadata.padelboard_profile.color}
          style={user.user_metadata.padelboard_profile.style}
        />
        <span className="pbw-hand">
          Hey, {user.user_metadata.padelboard_profile.name}. Ready for a rally?
        </span>
      </div>
      <div className="pbw-title">
        <div>
          <span className="pbw-eyebrow">YOUR PADEL CLUBHOUSE</span>
          <h1>Every match has a story.</h1>
          <p>Your live boards and past matches, all in one place.</p>
        </div>
        <Link href="/dashboard/new" className="pbw-primary">
          New match →
        </Link>
      </div>
      {error ? (
        <section className="pbw-card" role="alert">
          We couldn’t load your matches. Refresh to try again.
        </section>
      ) : (
        <MatchHistory rows={rows} />
      )}
    </main>
  );
}
