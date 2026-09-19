import type { MatchRow, OverlayJson } from "@/types/match";
/** A new match keeps presentation settings, never the previous match's runtime. */
export function reusableOverlay(overlay: OverlayJson): OverlayJson {
  const { clock, scoreHistory, analytics, ...design } = overlay;
  return {
    ...structuredClone(design),
    showScoreboard: true,
    clock: { elapsedMs: 0, runningSince: null },
    scoreHistory: [],
  };
}
export type SavedBoardSetup = Pick<MatchRow, "teams" | "config" | "overlay">;
