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
/** `width`/`height` são as dimensões intrínsecas do ficheiro (2× a altura de
 *  exibição, para ecrãs retina). Declará-las evita o salto de layout enquanto
 *  a imagem carrega — o rodapé está no fundo de todas as páginas e é
 *  precisamente onde um reflow tardio se nota. */
const SIBLINGS = [
  {
    id: "nachos",
    name: "PadelNachos",
    href: "https://padelnachos.com/",
    logo: "/images/brand/padelnachos.png",
    width: 84,
    height: 60,
  },
  {
    id: "god",
    name: "PadelGod",
    href: "https://padelgod.io/",
    logo: "/images/brand/padelgod.png",
    width: 84,
    height: 33,
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
                {/* alt vazio: o nome da marca está no <strong> a seguir, e
                    repeti-lo faria o leitor de ecrã dizê-lo duas vezes. */}
                <img
                  className={`pbl-footer-logo is-${sibling.id}`}
                  src={sibling.logo}
                  alt=""
                  width={sibling.width}
                  height={sibling.height}
                />
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
