import { it, expect } from "vitest";
import { pointLabel, scoreboardNotice } from "../scoreboard-labels";
import { createInitialState, apply, type MatchState } from "../padel-scoring";
import { defaultConfig } from "@/types/match";
it("labels the Star Point sequence without changing scoring", () => {
  let s: MatchState = {
    ...createInitialState({ ...defaultConfig(), deuceRule: "star-point" }),
    currentGame: { a: 40, b: 40 },
  };
  expect(pointLabel(s, "a")).toBe("40");
  s = apply(s, { kind: "point_for", team: "a" });
  expect(pointLabel(s, "a")).toBe("AD1");
  s = apply(s, { kind: "point_for", team: "b" });
  expect(pointLabel(s, "a")).toBe("D1");
  expect(pointLabel(s, "b")).toBe("D1");
  s = apply(s, { kind: "point_for", team: "a" });
  expect(pointLabel(s, "a")).toBe("AD2");
  s = apply(s, { kind: "point_for", team: "b" });
  expect(pointLabel(s, "a")).toBe("D2");
  expect(scoreboardNotice(s)).toContain("STAR POINT");
  s = apply(s, { kind: "point_for", team: "a" });
  expect(pointLabel(s, "a")).toBe("0");
});
it("shows AD for standard advantage, not numbered deuce", () => {
  const s: MatchState = {
    ...createInitialState({
      ...defaultConfig(),
      deuceRule: "advantage" as const,
    }),
    currentGame: { a: "Adv" as const, b: 40 },
    advantageReturns: 2,
  };
  expect(pointLabel(s, "a")).toBe("AD");
  expect(pointLabel(s, "b")).toBe("40");
});
it("shows break, set and match notices", () => {
  const s: MatchState = {
    ...createInitialState({
      ...defaultConfig(),
      deuceRule: "advantage" as const,
    }),
    currentGame: { a: 0, b: 40 },
  };
  expect(scoreboardNotice(s)).toBe("BREAK POINT");
  expect(scoreboardNotice({ ...s, sets: [{ a: 0, b: 5 }] })).toBe("SET POINT");
  expect(
    scoreboardNotice({
      ...s,
      sets: [
        { a: 0, b: 6 },
        { a: 0, b: 5 },
      ],
    }),
  ).toBe("MATCH POINT");
});
