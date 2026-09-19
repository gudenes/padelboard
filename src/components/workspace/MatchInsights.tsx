"use client";
import type { MatchRow } from "@/types/match";
import { useMatchState } from "@/hooks/useMatchState";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { MatchAnalytics } from "./MatchAnalytics";
export function MatchInsights({ initial }: { initial: MatchRow }) {
  const row = useMatchState(initial.id, initial);
  return (
    <main className="pbw">
      <WorkspaceHeader
        matchCode={row.short_code}
        matchName={row.overlay.tournamentName}
      />
      <div className="pbw-title">
        <div>
          <span className="pbw-eyebrow">EVERY POINT TELLS A STORY</span>
          <h1>Your match, in numbers.</h1>
          <p>Follow the rhythm of the match as points are recorded.</p>
        </div>
      </div>
      <MatchAnalytics row={row} />
    </main>
  );
}
