import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { serverSupabase } from "@/lib/supabase-server";
import { localeAlternates } from "@/lib/seo";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceBrand } from "@/components/workspace/WorkspaceBrand";
import { LanguageChip } from "@/components/i18n/LanguageChip";
import { HelpGuides } from "./HelpGuides";
import "@/components/workspace/workspace.css";
import "./help.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "help" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { languages: localeAlternates("/help") },
  };
}

export default async function HelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("common");
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
          <nav className="pbw-main-nav" aria-label={t("navMainAria")}>
            <Link href="/">{t("navHome")}</Link>
            <Link href="/manifesto">{t("navManifesto")}</Link>
            <Link href="/help" aria-current="page">
              {t("navHelp")}
            </Link>
          </nav>
          <LanguageChip />
          <Link href="/login" className="pbw-primary">
            {t("navSignIn")} →
          </Link>
        </header>
      )}
      <HelpGuides />
    </main>
  );
}
