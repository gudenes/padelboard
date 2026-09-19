import type { MatchRow } from "@/types/match";
import { MatchDuration } from "./MatchDuration";
import "./match-time.css";
export function AnimatedMatchTime({ row }: { row: MatchRow }) {
  return (
    <div
      className={`pb-match-time ${row.overlay.showTimer ? "is-visible" : ""}`}
      aria-hidden={!row.overlay.showTimer}
    >
      <div className="pb-match-time-clip">
        <span className="pb-match-time-label">
          MATCH TIME · <MatchDuration row={row} />
        </span>
      </div>
    </div>
  );
}
