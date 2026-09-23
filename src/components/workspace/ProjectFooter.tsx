"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import "./project-footer.css";

/**
 * Os três produtos da família. A marca é um glifo num círculo, não um ficheiro
 * de imagem: um wordmark de duas linhas é ilegível aos 44px que o rodapé dá,
 * e um glifo em CSS fica nítido em qualquer ecrã sem pedido de rede nenhum.
 * O nome é marca e não se traduz; a descrição é copy e traduz-se.
 */
const SIBLINGS = [
  {
    id: "nachos",
    name: "PadelNachos",
    href: "https://padelnachos.com/",
    glyph: "N",
  },
  {
    id: "god",
    name: "PadelGod",
    href: "https://padelgod.com/",
    glyph: "♛",
  },
] as const;

export function ProjectFooter() {
  const t = useTranslations("common");
  const path = usePathname();
  if (path.startsWith("/overlay/") || path.endsWith("/remote")) return null;
  return (
    <footer className="pbl-footer" aria-label={t("footerAboutAria")}>
      <div className="pbl-footer-inner">
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
          <span>{t("footerLabsTagline")}</span>
        </a>

        <ul className="pbl-footer-family" aria-label={t("footerFamilyAria")}>
          {SIBLINGS.map((sibling) => (
            <li key={sibling.id}>
              <a href={sibling.href} target="_blank" rel="noreferrer">
                <span
                  className={`pbl-footer-mark is-${sibling.id}`}
                  aria-hidden="true"
                >
                  {sibling.glyph}
                </span>
                <span className="pbl-footer-family-text">
                  <strong>{sibling.name}</strong>
                  <span>{t(`footerTagline_${sibling.id}`)}</span>
                </span>
              </a>
            </li>
          ))}
          <li>
            <Link href="/">
              <span className="pbl-footer-mark is-board" aria-hidden="true">
                ✳
              </span>
              <span className="pbl-footer-family-text">
                <strong>Padelboard</strong>
                <span>{t("footerTagline")}</span>
              </span>
            </Link>
          </li>
        </ul>

        <nav aria-label={t("navFooterAria")}>
          <Link href="/manifesto">{t("navManifesto")}</Link>
          <Link href="/help">{t("navHelp")}</Link>
        </nav>
      </div>
    </footer>
  );
}
