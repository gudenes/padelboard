import { it, expect } from "vitest";
import { reusableOverlay } from "../reuse-board";
import { defaultConfig, defaultOverlay } from "@/types/match";
import { createInitialState } from "../padel-scoring";
it("reuses presentation settings while clearing clock and point history", () => {
  const previous = {
    ...defaultOverlay(),
    template: "custom" as const,
    tournamentName: "Club final",
    showTimer: false,
    customColors: { accent: { color: "#ff95c7" } },
    clock: { elapsedMs: 9000, runningSince: "2026-09-19T00:00:00Z" },
    scoreHistory: [createInitialState(defaultConfig())],
  };
  const next = reusableOverlay(previous);
  expect(next.template).toBe("custom");
  expect(next.customColors).toEqual(previous.customColors);
  expect(next.tournamentName).toBe("Club final");
  expect(next.showTimer).toBe(false);
  expect(next.clock).toEqual({ elapsedMs: 0, runningSince: null });
  expect(next.scoreHistory).toEqual([]);
  next.customColors.accent.color = "#000000";
  expect(previous.customColors.accent.color).toBe("#ff95c7");
  expect(previous.scoreHistory).toHaveLength(1);
  expect(previous.clock.elapsedMs).toBe(9000);
});
