import Link from "next/link";
import { redirect } from "next/navigation";
import { serverSupabase, serviceSupabase } from "@/lib/supabase-server";
import { WorkspaceBrand } from "@/components/workspace/WorkspaceBrand";
import { FinishSetup } from "@/components/workspace/FinishSetup";
import "@/components/workspace/workspace.css";
export default async function Welcome({
  searchParams,
}: {
  searchParams: Promise<{ match?: string }>;
}) {
  const { match } = await searchParams;
  const sb = await serverSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");
  let row: null | { id: string; short_code: string; status: string } = null;
  if (match && /^[0-9a-f-]{36}$/i.test(match)) {
    const { data } = await serviceSupabase()
      .from("matches")
      .select("id,short_code,status,owner_id")
      .eq("id", match)
      .single();
    if (data && (data.status === "draft" || data.owner_id === user.id))
      row = data;
  }
  if (user.user_metadata?.padelboard_profile?.completed)
    redirect(row ? `/m/${row.short_code}` : "/dashboard");
  return (
    <main className="pbw pbw-onboarding">
      <header className="pbw-nav">
        <WorkspaceBrand />
        <Link href="/">Home ↗</Link>
      </header>
      <section className="pbw-card pbw-signin">
        <FinishSetup
          matchId={row?.id}
          shortCode={row?.short_code}
          claimDraft={row?.status === "draft"}
        />
      </section>
    </main>
  );
}
