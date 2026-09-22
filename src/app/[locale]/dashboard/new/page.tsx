import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { serverSupabase } from "@/lib/supabase-server";
import { NewMatchWorkspace } from "@/components/workspace/NewMatchWorkspace";
import { reusableOverlay, type SavedBoardSetup } from "@/lib/reuse-board";
export const dynamic = "force-dynamic";
export default async function NewMatch() {
  const t = await getTranslations("dashboard");
  const sb = await serverSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");
  if (!user.user_metadata?.padelboard_profile?.completed) redirect("/welcome");
  const { data, error } = await sb
    .from("matches")
    .select("teams,config,overlay")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error)
    return (
      <main style={{ padding: 40 }}>
        <h1>{t("newBoardErrorTitle")}</h1>
        <p>{t("newBoardErrorBody")}</p>
        <Link href="/dashboard">{t("newBoardErrorBackLink")}</Link>
      </main>
    );
  const latest = data
    ? ({ ...data, overlay: reusableOverlay(data.overlay) } as SavedBoardSetup)
    : null;
  return (
    <NewMatchWorkspace
      latest={latest}
      aiAvailable={Boolean(process.env.OPENAI_API_KEY)}
    />
  );
}
