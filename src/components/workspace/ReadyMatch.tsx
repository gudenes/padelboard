"use client";

import Link from "next/link";

import type { MatchRow } from "@/types/match";
import { WorkspaceBrand } from "./WorkspaceBrand";
import { FinishSetup } from "./FinishSetup";
import { BoardPreview } from "./BoardPreview";
import "./workspace.css";
export function ReadyMatch({ row }: { row: MatchRow }) {
  return (
    <main className="pbw pbw-onboarding">
      <header className="pbw-nav">
        <WorkspaceBrand />
        <Link href="/dashboard">My matches ↗</Link>
      </header>
      <ol className="pbw-journey" aria-label="Board setup progress">
        <li>
          <span>01</span> Make it yours <b>✓</b>
        </li>
        <li aria-current="step">
          <span>02</span> Make it official
        </li>
        <li>
          <span>03</span> Play & stream
        </li>
      </ol>
      <section className="pbw-ready">
        <div>
          <span className="pbw-hand pbw-ready-kicker">
            LOOKING GOOD. LET’S PLAY.
          </span>
          <h1>
            Your board.
            <br />
            Your game.
            <br />
            <span>Let’s play.</span>
          </h1>
          <p>
            One quick sign-in. Then you’re on court — with your board, your
            controls and every match saved.
          </p>
          <FinishSetup matchId={row.id} shortCode={row.short_code} />
        </div>
        <div className="pbw-ready-preview">
          <span className="pbw-hand pbw-preview-note">
            Yep. That’s your board.
          </span>
          <BoardPreview row={row} />
          <div className="pbw-ready-art">
            <p className="pbw-hand">
              Big match energy.
              <br />
              Zero setup drama.
            </p>
            <img src="/images/padel-ball.png" alt="" />
          </div>
          <span className="pbw-preview-caption">
            YOUR PLAYERS · YOUR COLORS · YOUR COURT
          </span>
        </div>
      </section>
      <footer className="pbw-brand-footer">
        SCORE <span>•</span> STREAM <span>•</span> PADEL
      </footer>
    </main>
  );
}
