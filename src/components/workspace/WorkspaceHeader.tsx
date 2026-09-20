"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { browserSupabase } from "@/lib/supabase";
import { PhoneControl } from "./PhoneControl";
import { WorkspaceBrand } from "./WorkspaceBrand";
import { PlayerAvatar } from "./PlayerAvatar";
import "./workspace.css";
export function WorkspaceHeader({
  matchCode,
  matchName,
  unified = false,
}: {
  matchCode?: string;
  matchName?: string;
  unified?: boolean;
}) {
  const path = usePathname(),
    router = useRouter(),
    menu = useRef<HTMLDetailsElement>(null);
  const [profile, setProfile] = useState({
      name: "Your account",
      color: "#f5ff36",
      style: "headband",
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    const refresh = () =>
      void browserSupabase()
        .auth.getUser()
        .then(({ data }) => {
          if (alive && data.user) {
            const p = data.user.user_metadata?.padelboard_profile;
            setProfile({
              name: p?.name || data.user.user_metadata?.name || "Your account",
              color: p?.color || "#f5ff36",
              style: p?.style || "headband",
            });
          }
        });
    refresh();
    window.addEventListener("padelboard-profile-updated", refresh);
    const outside = (e: PointerEvent) => {
      if (menu.current && !menu.current.contains(e.target as Node))
        menu.current.open = false;
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", esc);
    return () => {
      alive = false;
      window.removeEventListener("padelboard-profile-updated", refresh);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", esc);
    };
  }, []);
  useEffect(() => {
    if (menu.current) menu.current.open = false;
  }, [path]);
  async function signOut() {
    setBusy(true);
    setError("");
    try {
      const { error } = await browserSupabase().auth.signOut();
      if (error) throw error;
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Could not sign out. Please retry.");
      setBusy(false);
    }
  }
  const section = path.endsWith("/insights")
    ? "Match insights"
    : path.endsWith("/studio")
      ? "Studio"
      : path.endsWith("/edit")
        ? "Edit scoreboard"
        : path === "/dashboard/profile"
          ? "Profile"
          : path === "/dashboard/new"
            ? "New match"
            : "Match controls";
  return (
    <div className="pbw-header">
      <header className="pbw-nav">
        <WorkspaceBrand href="/dashboard" />
        <nav aria-label="Workspace navigation" className="pbw-main-nav">
          <Link
            href="/dashboard"
            aria-current={path === "/dashboard" ? "page" : undefined}
          >
            My matches
          </Link>
          <Link
            href="/dashboard/new"
            aria-current={path === "/dashboard/new" ? "page" : undefined}
          >
            + New match
          </Link>
        </nav>
        <details ref={menu} className="pbw-account">
          <summary aria-label={`Account menu: ${profile.name}`}>
            <PlayerAvatar color={profile.color} style={profile.style} />
            <span>{profile.name}</span>
            <span aria-hidden="true">⌄</span>
          </summary>
          <div className="pbw-account-panel">
            <span className="pbw-muted">YOUR PADELBOARD</span>
            <Link
              href="/dashboard/profile"
              aria-current={path === "/dashboard/profile" ? "page" : undefined}
            >
              Edit profile & avatar →
            </Link>
            <Link href="/dashboard">My matches</Link>
            <button disabled={busy} onClick={() => void signOut()}>
              {busy ? "Signing out…" : "Sign out"}
            </button>
            {error && <p role="alert">{error}</p>}
          </div>
        </details>
      </header>
      <nav className="pbw-breadcrumbs" aria-label="Breadcrumb">
        <Link
          href="/dashboard"
          aria-current={path === "/dashboard" ? "page" : undefined}
        >
          My matches
        </Link>
        {path !== "/dashboard" && (
          <>
            <span aria-hidden="true">/</span>
            {matchCode && path !== `/m/${matchCode}` && (
              <>
                <Link href={`/m/${matchCode}`}>{matchName || matchCode}</Link>
                <span aria-hidden="true">/</span>
              </>
            )}
            <span aria-current="page">
              {matchCode && path === `/m/${matchCode}`
                ? matchName || (unified ? "Match workspace" : "Match controls")
                : section}
            </span>
          </>
        )}
      </nav>
      {matchCode && !unified && (
        <nav className="pbw-match-nav" aria-label="Match navigation">
          {[
            ["", "Controls"],
            ["/studio", "Studio"],
            ["/insights", "Match insights"],
            ["/edit", "Scoreboard"],
          ].map(([suffix, label]) => (
            <Link
              key={suffix}
              href={`/m/${matchCode}${suffix}`}
              aria-current={
                path === `/m/${matchCode}${suffix}` ? "page" : undefined
              }
            >
              {label}
            </Link>
          ))}
          <PhoneControl code={matchCode} />
        </nav>
      )}
    </div>
  );
}
