import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { serverSupabase } from "@/lib/supabase-server";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceBrand } from "@/components/workspace/WorkspaceBrand";
import { HelpGuides } from "./HelpGuides";
import "@/components/workspace/workspace.css";
import "./help.css";

export const metadata: Metadata = {
  title: "Help & guides — Padelboard",
  description:
    "Your first stream, one easy step at a time. Learn Padelboard Studio, OBS overlays and phone controls.",
};
export default async function HelpPage() {
  const sb = await serverSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return (
    <main className="pbw pbh">
      {user ? (
        <WorkspaceHeader />
      ) : (
        <header className="pbw-nav">
          <WorkspaceBrand />
          <nav className="pbw-main-nav" aria-label="Main navigation">
            <Link href="/">Home</Link>
            <Link href="/manifesto">Our manifesto</Link>
            <Link href="/help" aria-current="page">
              Help & guides
            </Link>
          </nav>
          <Link href="/login" className="pbw-primary">
            Sign in →
          </Link>
        </header>
      )}
      <HelpGuides />
    </main>
  );
}
