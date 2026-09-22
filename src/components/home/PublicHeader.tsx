import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function PublicHeader({ manifesto = false }: { manifesto?: boolean }) {
  const t = useTranslations("common");
  return (
    <header className="pb-header pb-container pb-public-header">
      <Link href="/" className="pb-wordmark" aria-label={t("navHomeAria")}>
        padelboard
        <span className="pb-logo-score"><sup>6</sup><span>/</span><sub>4</sub></span>
      </Link>
      <nav aria-label={t("navMainAria")}>
        <Link href="/manifesto" aria-current={manifesto ? "page" : undefined}>{t("navManifesto")}</Link>
        <Link href="/help">{t("navHelp")}</Link>
        <Link href="/dashboard">{t("navMatches")}</Link>
      </nav>
      <Link className="pb-button pb-nav-cta" href="/login">{t("navSignIn")} <span aria-hidden="true">→</span></Link>
    </header>
  );
}
