import { expect, it } from "vitest";
import { matchesSearch, matchStatus } from "../match-search";
import { createInitialState } from "../padel-scoring";
import { defaultConfig, defaultOverlay, type MatchRow } from "@/types/match";
const config = { ...defaultConfig(), deuceRule: "star-point" as const };
const row: MatchRow = {
  id: "private-id",
  owner_id: "owner-secret",
  draft_token: "draft-secret",
  short_code: "ABC123",
  status: "published",
  config,
  state: createInitialState(config),
  teams: {
    a: { name: "Pair one", players: ["Galán", "Chingotto"] },
    b: { name: "Pair two", players: ["Coello", "Tapia"] },
  },
  overlay: {
    ...defaultOverlay(),
    tournamentName: "Club final",
    round: "Semifinal",
    template: "tour-fip",
  },
  tournament_label: null,
  published_at: null,
  started_at: "2026-09-20T10:00:00Z",
  finished_at: null,
  created_at: "2026-09-20T10:00:00Z",
  updated_at: "2026-09-20T10:00:00Z",
};
it.each([
  "galan",
  "GALÁN final",
  "chingotto coello",
  "abc123",
  "20/09/2026",
  "September",
  "star point",
  "best of 3",
  "fip",
  "semifinal",
  "live",
])("finds a match by %s", (query) =>
  expect(matchesSearch(row, query)).toBe(true),
);
it("requires every search term and excludes internal identifiers", () => {
  expect(matchesSearch(row, "galan missing")).toBe(false);
  expect(matchesSearch(row, "owner-secret")).toBe(false);
  expect(matchesSearch(row, "draft-secret")).toBe(false);
  expect(matchesSearch(row, "  ")).toBe(true);
});
it("supports non-Latin player names", () => {
  const copy = {
    ...row,
    teams: {
      ...row.teams,
      a: { name: "Pair one", players: ["王", "李"] as [string, string] },
    },
  };
  expect(matchesSearch(copy, "王")).toBe(true);
  expect(matchesSearch(copy, "张")).toBe(false);
});
it("distinguishes ready, paused, finished and abandoned", () => {
  expect(matchStatus({ ...row, started_at: null })).toBe("Ready");
  expect(
    matchStatus({
      ...row,
      overlay: {
        ...row.overlay,
        clock: { elapsedMs: 5000, runningSince: null },
      },
    }),
  ).toBe("Paused");
  expect(matchStatus({ ...row, status: "finished" })).toBe("Finished");
  expect(matchStatus({ ...row, status: "abandoned" })).toBe("Abandoned");
});
