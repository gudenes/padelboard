"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

import type { MatchRow } from "@/types/match";
import { WorkspaceBrand } from "./WorkspaceBrand";
import { FinishSetup } from "./FinishSetup";
import { BoardPreview } from "./BoardPreview";
import "./workspace.css";
export function ReadyMatch({ row }: { row: MatchRow }) {
  const t = useTranslations("workspace");
  return (
    <main className="pbw pbw-onboarding">
      <header className="pbw-nav">
        <WorkspaceBrand />
        <Link href="/dashboard">{t("readyMyMatches")}</Link>
      </header>
      <ol className="pbw-journey" aria-label={t("readyJourneyAria")}>
        <li>
          <span>01</span> {t("readyStepOne")} <b>✓</b>
        </li>
        <li aria-current="step">
          <span>02</span> {t("readyStepTwo")}
        </li>
        <li>
          <span>03</span> {t("readyStepThree")}
        </li>
      </ol>
      <section className="pbw-ready">
        <div>
          <span className="pbw-hand pbw-ready-kicker">{t("readyKicker")}</span>
          <h1>
            {t.rich("readyHeadline", {
              br: () => <br />,
              highlight: (chunks) => <span>{chunks}</span>,
            })}
          </h1>
          <p>{t("readyLead")}</p>
          <FinishSetup matchId={row.id} shortCode={row.short_code} />
        </div>
        <div className="pbw-ready-preview">
          <span className="pbw-hand pbw-preview-note">
            {t("readyPreviewNote")}
          </span>
          <BoardPreview row={row} />
          <div className="pbw-ready-art">
            <p className="pbw-hand">
              {t.rich("readyArt", { br: () => <br /> })}
            </p>
            <img src="/images/padel-ball.png" alt="" />
          </div>
          <span className="pbw-preview-caption">
            {t("readyPreviewCaption")}
          </span>
        </div>
      </section>
      <footer className="pbw-brand-footer">
        {t.rich("readyFooter", { dot: () => <span>•</span> })}
      </footer>
    </main>
  );
}
