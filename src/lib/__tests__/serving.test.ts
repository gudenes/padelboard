import { it, expect } from "vitest";
import { apply, createInitialState, type MatchState } from "../padel-scoring";
import { defaultConfig } from "@/types/match";
const fresh = () => createInitialState(defaultConfig());
function game(s: MatchState) {
  for (let i = 0; i < 4; i++) s = apply(s, { kind: "point_for", team: "a" });
  return s;
}
it("rotates all four players after a chosen first server", () => {
  let s = apply(fresh(), { kind: "set_server", team: "a", player: 1 });
  expect([s.servingTeam, s.servingPlayer]).toEqual(["a", 2]);
  for (const [team, player] of [
    ["b", 1],
    ["a", 0],
    ["b", 3],
    ["a", 2],
  ]) {
    s = game(s);
    expect([s.servingTeam, s.servingPlayer]).toEqual([team, player]);
  }
});
it("changes server after one tiebreak point and then every two", () => {
  let s: MatchState = { ...fresh(), phase: "tiebreak", sets: [{ a: 6, b: 6 }] };
  for (const player of [1, 1, 2, 2, 3, 3, 0, 0]) {
    s = apply(s, {
      kind: "point_for",
      team: Number(s.currentGame.a) > Number(s.currentGame.b) ? "b" : "a",
    });
    expect(s.servingPlayer).toBe(player);
  }
});
it("starts the next set with the pair that received first in the tiebreak", () => {
  let s: MatchState = { ...fresh(), phase: "tiebreak", sets: [{ a: 6, b: 6 }] };
  for (let i = 0; i < 7; i++) s = apply(s, { kind: "point_for", team: "a" });
  expect(s.phase).toBe("playing");
  expect(s.sets).toEqual([
    { a: 7, b: 6 },
    { a: 0, b: 0 },
  ]);
  expect(s.servingTeam).toBe("b");
  expect(s.servingPlayer).toBe(1);
});
it("reset works even after the scoring engine has finished", () => {
  const s: MatchState = {
    ...fresh(),
    phase: "finished",
    winner: "a",
    endReason: "completed",
  };
  expect(apply(s, { kind: "reset" })).toEqual(fresh());
});

it("lets both pairs choose their first server without losing the partner rotation", () => {
  let s = apply(fresh(), { kind: "set_server", team: "a", player: 1 });
  s = game(s);
  s = apply(s, { kind: "set_server", team: "b", player: 1 });
  expect(s.servingPlayer).toBe(3);
  s = game(s);
  expect(s.servingPlayer).toBe(0);
  s = game(s);
  expect(s.servingPlayer).toBe(1);
});
