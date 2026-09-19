import { describe, it, expect } from "vitest";
import {
  elapsedTime,
  pauseClock,
  formatDuration,
  matchClock,
} from "../match-clock";
import type { MatchRow } from "@/types/match";
describe("persistent match duration", () => {
  it("accumulates play while excluding pauses across reloads", () => {
    const clock = {
      elapsedMs: 2000,
      runningSince: new Date(10000).toISOString(),
    };
    expect(elapsedTime(clock, 15000)).toBe(7000);
    const paused = pauseClock(clock, 15000);
    expect(elapsedTime(paused, 90000)).toBe(7000);
    expect(
      elapsedTime(
        { ...paused, runningSince: new Date(100000).toISOString() },
        103000,
      ),
    ).toBe(10000);
  });
  it("formats multi-hour matches and never uses wall-clock time during a pause", () => {
    expect(formatDuration(3723000)).toBe("01:02:03");
    expect(elapsedTime({ elapsedMs: 0, runningSince: null }, 90000)).toBe(0);
  });
  it("supports legacy completed matches", () => {
    const row = {
      overlay: {},
      started_at: new Date(0).toISOString(),
      finished_at: new Date(65000).toISOString(),
    } as MatchRow;
    expect(matchClock(row)).toEqual({ elapsedMs: 65000, runningSince: null });
  });
});
