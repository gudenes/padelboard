import type { MatchRow } from "@/types/match";
export interface MatchClock {
  elapsedMs: number;
  runningSince: string | null;
}
export function matchClock(row: MatchRow): MatchClock {
  return (
    row.overlay.clock ?? {
      elapsedMs:
        row.started_at && row.finished_at
          ? Math.max(
              0,
              Date.parse(row.finished_at) - Date.parse(row.started_at),
            )
          : 0,
      runningSince: row.started_at && !row.finished_at ? row.started_at : null,
    }
  );
}
export function elapsedTime(clock: MatchClock, now = Date.now()) {
  return Math.max(
    0,
    clock.elapsedMs +
      (clock.runningSince
        ? Math.max(0, now - Date.parse(clock.runningSince))
        : 0),
  );
}
export function pauseClock(clock: MatchClock, now: number): MatchClock {
  return { elapsedMs: elapsedTime(clock, now), runningSince: null };
}
export function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 3600)
    .toString()
    .padStart(2, "0")}:${Math.floor((s / 60) % 60)
    .toString()
    .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}
