import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { serverSupabase } from "@/lib/supabase-server";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { FinishSetup } from "@/components/workspace/FinishSetup";
import "@/components/workspace/workspace.css";
export default async function Profile() {
  const t = await getTranslations("dashboard");
  const sb = await serverSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");
  return (
    <main className="pbw">
      <WorkspaceHeader />
      <div className="pbw-title">
        <div>
          <span className="pbw-eyebrow">{t("profileEyebrow")}</span>
          <h1>{t("profileTitle")}</h1>
          <p>{t("profileLead")}</p>
        </div>
      </div>
      <section className="pbw-card pbw-profile-page">
        <FinishSetup editProfile />
      </section>
    </main>
  );
}
