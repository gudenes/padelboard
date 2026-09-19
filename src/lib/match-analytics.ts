import type { MatchState, TeamId } from "./padel-scoring";
export interface RecordedPoint {
  team: TeamId;
  server: TeamId;
  elapsedMs: number;
  intervalMs: number | null;
  set: number;
  game: number;
  gameEnd: boolean;
  setEnd: boolean;
}
export interface MatchAnalytics {
  baselineMs: number | null;
  points: RecordedPoint[];
}
export function recordPoint(
  previous: MatchAnalytics | undefined,
  before: MatchState,
  after: MatchState,
  team: TeamId,
  elapsedMs: number,
): MatchAnalytics {
  const data = previous ?? { baselineMs: null, points: [] };
  const last = data.points.at(-1)?.elapsedMs ?? data.baselineMs;
  const set = before.sets.length,
    score = before.sets[set - 1];
  const setEnd = after.sets.length > set || after.phase === "finished";
  const gameEnd =
    setEnd ||
    after.sets[set - 1].a !== score.a ||
    after.sets[set - 1].b !== score.b;
  return {
    ...data,
    points: [
      ...data.points,
      {
        team,
        server: before.servingTeam,
        elapsedMs,
        intervalMs: last === null ? null : Math.max(0, elapsedMs - last),
        set,
        game: score.a + score.b + 1,
        gameEnd,
        setEnd,
      },
    ],
  };
}
export function summarizePoints(points: RecordedPoint[]) {
  const known = points.filter((p) => p.intervalMs !== null);
  const totals = { a: 0, b: 0 };
  let streak = 0,
    longest = 0,
    last: TeamId | null = null;
  const groups = new Map<
    string,
    {
      label: string;
      ms: number;
      points: number;
      complete: boolean;
      timed: boolean;
    }
  >();
  for (const p of points) {
    totals[p.team]++;
    streak = last === p.team ? streak + 1 : 1;
    last = p.team;
    longest = Math.max(longest, streak);
    for (const [key, label, end] of [
      [`s${p.set}`, `Set ${p.set}`, p.setEnd],
      [`s${p.set}g${p.game}`, `Set ${p.set} · Game ${p.game}`, p.gameEnd],
    ] as const) {
      const g = groups.get(key) ?? {
        label,
        ms: 0,
        points: 0,
        complete: false,
        timed: true,
      };
      g.ms += p.intervalMs ?? 0;
      g.points++;
      g.complete = end;
      g.timed &&= p.intervalMs !== null;
      groups.set(key, g);
    }
  }
  return {
    totals,
    longest,
    average: known.length
      ? known.reduce((sum, p) => sum + p.intervalMs!, 0) / known.length
      : null,
    groups: [...groups.values()],
    serveWon: points.filter((p) => p.team === p.server).length,
  };
}
