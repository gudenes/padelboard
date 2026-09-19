import { it, expect } from "vitest";
import { recordPoint, summarizePoints } from "../match-analytics";
import { apply, createInitialState } from "../padel-scoring";
import { defaultConfig } from "@/types/match";
it("records point intervals and completed games from the match clock", () => {
  let state = createInitialState(defaultConfig());
  let data = {
    baselineMs: 0 as number | null,
    points: [] as ReturnType<typeof recordPoint>["points"],
  };
  for (let i = 1; i <= 4; i++) {
    const next = apply(state, { kind: "point_for", team: "a" });
    data = recordPoint(data, state, next, "a", i * 10000);
    state = next;
  }
  const s = summarizePoints(data.points);
  expect(s.totals).toEqual({ a: 4, b: 0 });
  expect(s.average).toBe(10000);
  expect(s.longest).toBe(4);
  expect(s.groups.find((g) => g.label === "Set 1 · Game 1")).toMatchObject({
    complete: true,
    ms: 40000,
    timed: true,
  });
});
it("does not invent a start time for an existing match", () => {
  const state = {
    ...createInitialState(defaultConfig()),
    currentGame: { a: 30, b: 15 },
  };
  const data = recordPoint(
    undefined,
    state,
    apply(state, { kind: "point_for", team: "a" }),
    "a",
    100000,
  );
  expect(data.points[0].intervalMs).toBeNull();
  expect(summarizePoints(data.points).average).toBeNull();
  expect(summarizePoints(data.points).groups[0].timed).toBe(false);
});
it("detects a completed set separately from the next set", () => {
  const state = {
    ...createInitialState(defaultConfig()),
    sets: [{ a: 5, b: 2 }],
    currentGame: { a: 40, b: 0 },
  };
  const data = recordPoint(
    { baselineMs: 20000, points: [] },
    state,
    apply(state, { kind: "point_for", team: "a" }),
    "a",
    35000,
  );
  expect(data.points[0]).toMatchObject({
    set: 1,
    game: 8,
    gameEnd: true,
    setEnd: true,
    intervalMs: 15000,
  });
});
