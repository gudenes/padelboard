import { WorkspaceBrand } from "@/components/workspace/WorkspaceBrand";
import Link from "next/link";
import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase-server";
import { SignIn } from "@/components/workspace/SignIn";
import "@/components/workspace/workspace.css";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ match?: string; auth_error?: string }>;
}) {
  const params = await searchParams;
  const matchId =
    params.match &&
    /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(params.match)
      ? params.match
      : undefined;
  const sb = await serverSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (user) redirect(`/auth/callback${matchId ? `?match=${matchId}` : ""}`);
  return (
    <main className="pbw pbw-onboarding pbw-login-page">
      <header className="pbw-nav">
        <WorkspaceBrand />
        <Link href="/">Create a board ↗</Link>
      </header>
      <section className="pbw-card pbw-signin">
        <span className="pbw-hand">BACK FOR ANOTHER MATCH?</span>
        <h1>
          More padel.
          <br />
          Less fuss.
        </h1>
        <p>Sign in to access your boards and match history.</p>
        {params.auth_error && (
          <p role="alert" className="pbw-error">
            We couldn’t verify this link. Request a new email code and enter it
            on this page.
          </p>
        )}
        <SignIn matchId={matchId} />
      </section>
      <img className="pbw-login-ball" src="/images/padel-ball.png" alt="" />
      <footer className="pbw-brand-footer">SCORE · STREAM · PADEL</footer>
    </main>
  );
}
