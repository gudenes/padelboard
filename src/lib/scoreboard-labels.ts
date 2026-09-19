import { getDeuceRule, type MatchState, type TeamId } from "./padel-scoring";
import { getMatchFlags } from "./match-flags";
export function pointLabel(state: MatchState, team: TeamId): string {
  const point = state.currentGame[team];
  if (state.phase !== "playing") return String(point);
  const star = getDeuceRule(state.config) === "star-point";
  const returns = state.advantageReturns ?? 0;
  if (point === "Adv") return star ? `AD${Math.min(2, returns + 1)}` : "AD";
  if (
    star &&
    point === 40 &&
    state.currentGame.a === 40 &&
    state.currentGame.b === 40 &&
    returns > 0
  )
    return `D${Math.min(2, returns)}`;
  return String(point);
}
export function scoreboardNotice(state: MatchState): string {
  if (state.phase === "finished") return "MATCH COMPLETE";
  const flags = getMatchFlags(state),
    labels: string[] = [];
  if (flags.starPoint) labels.push("STAR POINT");
  else if (flags.goldenPoint) labels.push("GOLDEN POINT");
  if (flags.matchPointFor) labels.push("MATCH POINT");
  else if (flags.setPointFor) labels.push("SET POINT");
  else if (flags.breakPointFor) labels.push("BREAK POINT");
  if (!labels.length && flags.inSuperTiebreak) labels.push("SUPER-TIEBREAK");
  else if (!labels.length && flags.inTiebreak) labels.push("TIEBREAK");
  return labels.join(" · ");
}
