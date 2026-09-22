"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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
  const t = useTranslations("workspace");
  const path = usePathname(),
    router = useRouter(),
    menu = useRef<HTMLDetailsElement>(null);
  const [profile, setProfile] = useState({
      name: t("accountDefaultName"),
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
              name:
                p?.name ||
                data.user.user_metadata?.name ||
                t("accountDefaultName"),
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
      setError(t("signOutError"));
      setBusy(false);
    }
  }
  const section =
    path === "/help"
      ? t("sectionHelp")
      : path.endsWith("/insights")
        ? t("sectionInsights")
        : path.endsWith("/studio")
          ? t("sectionStudio")
          : path.endsWith("/edit")
            ? t("sectionEdit")
            : path === "/dashboard/profile"
              ? t("sectionProfile")
              : path === "/dashboard/new"
                ? t("sectionNewMatch")
                : t("sectionControls");
  return (
    <div className="pbw-header">
      <header className="pbw-nav">
        <WorkspaceBrand href="/dashboard" />
        <nav aria-label={t("navAria")} className="pbw-main-nav">
          <Link
            href="/dashboard"
            aria-current={path === "/dashboard" ? "page" : undefined}
          >
            {t("navMatches")}
          </Link>
          <Link
            href="/dashboard/new"
            aria-current={path === "/dashboard/new" ? "page" : undefined}
          >
            {t("navNewMatch")}
          </Link>
          <Link
            href="/help"
            aria-current={path === "/help" ? "page" : undefined}
          >
            {t("navHelp")}
          </Link>
        </nav>
        <details ref={menu} className="pbw-account">
          <summary aria-label={t("accountMenuAria", { name: profile.name })}>
            <PlayerAvatar color={profile.color} style={profile.style} />
            <span>{profile.name}</span>
            <span aria-hidden="true">⌄</span>
          </summary>
          <div className="pbw-account-panel">
            <span className="pbw-muted">{t("accountPanelEyebrow")}</span>
            <Link
              href="/dashboard/profile"
              aria-current={path === "/dashboard/profile" ? "page" : undefined}
            >
              {t("accountEditProfile")}
            </Link>
            <Link href="/dashboard">{t("navMatches")}</Link>
            <button disabled={busy} onClick={() => void signOut()}>
              {busy ? t("accountSigningOut") : t("accountSignOut")}
            </button>
            {error && <p role="alert">{error}</p>}
          </div>
        </details>
      </header>
      <nav className="pbw-breadcrumbs" aria-label={t("breadcrumbAria")}>
        <Link
          href="/dashboard"
          aria-current={path === "/dashboard" ? "page" : undefined}
        >
          {t("navMatches")}
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
                ? matchName ||
                  (unified ? t("sectionWorkspace") : t("sectionControls"))
                : section}
            </span>
          </>
        )}
      </nav>
      {matchCode && !unified && (
        <nav className="pbw-match-nav" aria-label={t("matchNavAria")}>
          {[
            ["", "matchNavControls"],
            ["/studio", "matchNavStudio"],
            ["/insights", "matchNavInsights"],
            ["/edit", "matchNavScoreboard"],
          ].map(([suffix, labelKey]) => (
            <Link
              key={suffix}
              href={`/m/${matchCode}${suffix}`}
              aria-current={
                path === `/m/${matchCode}${suffix}` ? "page" : undefined
              }
            >
              {t(labelKey)}
            </Link>
          ))}
          <PhoneControl code={matchCode} />
        </nav>
      )}
    </div>
  );
}
