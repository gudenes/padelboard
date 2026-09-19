import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase-server";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { FinishSetup } from "@/components/workspace/FinishSetup";
import "@/components/workspace/workspace.css";
export default async function Profile() {
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
          <span className="pbw-eyebrow">YOUR CORNER OF THE COURT</span>
          <h1>Your profile. Your personality.</h1>
          <p>Keep your details and court-side avatar up to date.</p>
        </div>
      </div>
      <section className="pbw-card pbw-profile-page">
        <FinishSetup editProfile />
      </section>
    </main>
  );
}
