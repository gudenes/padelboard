"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import "./project-footer.css";

export function ProjectFooter() {
  const t = useTranslations("common");
  const path = usePathname();
  if (path.startsWith("/overlay/") || path.endsWith("/remote")) return null;
  return (
    <footer className="pbl-footer" aria-label={t("footerAboutAria")}>
      <div className="pbl-footer-inner">
        <div className="pbl-footer-note">
          <span className="pbl-footer-mark" aria-hidden="true">
            ✳
          </span>
          <div>
            <p>{t("footerTagline")}</p>
          </div>
        </div>
        <a
          className="pbl-footer-project"
          href="https://padellabs.tech/"
          target="_blank"
          rel="noreferrer"
        >
          <span>{t("footerProjectBy")}</span>
          <strong>
            padel labs<span aria-hidden="true"> ↗</span>
          </strong>
        </a>
        <nav aria-label={t("navFooterAria")}>
          <Link href="/manifesto">{t("navManifesto")}</Link>
          <Link href="/help">{t("navHelp")}</Link>
        </nav>
      </div>
    </footer>
  );
}
