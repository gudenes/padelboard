import { beforeEach, describe, it, expect, vi } from "vitest";
import { createInitialState } from "../padel-scoring";
import { defaultConfig, defaultOverlay } from "@/types/match";
const ctx = vi.hoisted(() => ({
  row: {} as any,
  owner: "owner",
  patch: {} as any,
}));
vi.mock("@/lib/supabase-server", () => ({
  serverSupabase: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: ctx.owner } } }) },
  }),
  serviceSupabase: () => ({
    from: (table: string) => {
      let updating = false;
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        single: async () => ({
          data: updating ? { ...ctx.row, ...ctx.patch } : ctx.row,
        }),
        update: (patch: any) => {
          ctx.patch = patch;
          updating = true;
          return chain;
        },
        insert: async () => ({ error: null }),
      };
      return chain;
    },
  }),
}));
import { POST } from "@/app/api/matches/[id]/action/route";
async function action(value: unknown) {
  return POST(
    new Request("http://localhost/api", {
      method: "POST",
      body: JSON.stringify({ action: value }),
    }),
    { params: Promise.resolve({ id: "match" }) },
  );
}
/** Estado + código estável: a resposta nunca leva prosa inglesa. */
async function result(value: unknown) {
  const response = await action(value);
  return { status: response.status, error: (await response.json()).error };
}
beforeEach(() => {
  ctx.owner = "owner";
  ctx.patch = {};
  ctx.row = {
    id: "match",
    owner_id: "owner",
    status: "published",
    state: createInitialState(defaultConfig()),
    overlay: defaultOverlay(),
    updated_at: new Date().toISOString(),
    started_at: null,
    finished_at: null,
  };
});
describe("operator API", () => {
  it("rejects other users and points before starting", async () => {
    ctx.owner = "other";
    expect(await result({ kind: "start_clock" })).toEqual({
      status: 403,
      error: "not_match_owner",
    });
    ctx.owner = "owner";
    expect(await result({ kind: "point_for", team: "a" })).toEqual({
      status: 409,
      error: "match_not_started",
    });
  });
  it("starts, scores, undoes and pauses with persisted state", async () => {
    let r = await action({ kind: "start_clock" });
    ctx.row = (await r.json()).row;
    expect(ctx.row.overlay.clock.runningSince).toBeTruthy();
    r = await action({ kind: "point_for", team: "a" });
    ctx.row = (await r.json()).row;
    expect(ctx.row.state.currentGame.a).toBe(15);
    expect(ctx.row.overlay.scoreHistory).toHaveLength(1);
    r = await action({ kind: "undo" });
    ctx.row = (await r.json()).row;
    expect(ctx.row.state.currentGame.a).toBe(0);
    expect(ctx.row.overlay.scoreHistory).toHaveLength(0);
    r = await action({ kind: "pause_clock" });
    expect((await r.json()).row.overlay.clock.runningSince).toBeNull();
  });
  it("finishes and resets both the score and clock", async () => {
    let r = await action({ kind: "finish_match" });
    ctx.row = (await r.json()).row;
    expect(ctx.row.status).toBe("finished");
    expect(await result({ kind: "point_for", team: "b" })).toEqual({
      status: 409,
      error: "match_finished",
    });
    r = await action({ kind: "reset" });
    const row = (await r.json()).row;
    expect(row.status).toBe("published");
    expect(row.started_at).toBeNull();
    expect(row.overlay.clock).toEqual({ elapsedMs: 0, runningSince: null });
  });
});

it("resets a naturally finished match into a playable state", async () => {
  ctx.row.status = "finished";
  ctx.row.state = {
    ...ctx.row.state,
    phase: "finished",
    winner: "a",
    endReason: "completed",
    sets: [
      { a: 6, b: 0 },
      { a: 6, b: 0 },
    ],
  };
  const r = await action({ kind: "reset" });
  const { row } = await r.json();
  expect(row.state.phase).toBe("playing");
  expect(row.state.winner).toBeNull();
  expect(row.state.sets).toEqual([{ a: 0, b: 0 }]);
});
it("validates and persists the selected pair and player", async () => {
  expect(await result({ kind: "set_server", team: "b", player: 2 })).toEqual({
    status: 400,
    error: "action_invalid",
  });
  expect(await result({ kind: "set_server", team: "c", player: 0 })).toEqual({
    status: 400,
    error: "action_invalid",
  });
  let r = await action({ kind: "set_server", team: "b", player: 1 });
  const { row } = await r.json();
  expect(row.state.servingTeam).toBe("b");
  expect(row.state.servingPlayer).toBe(3);
  ctx.row.status = "finished";
  expect(await result({ kind: "set_server", team: "a", player: 0 })).toEqual({
    status: 409,
    error: "match_finished_server_change",
  });
  ctx.row.status = "published";
  ctx.owner = "someone-else";
  expect(await result({ kind: "set_server", team: "a", player: 0 })).toEqual({
    status: 403,
    error: "not_match_owner",
  });
});

it("toggles stream time without pausing or changing the score", async () => {
  ctx.row.overlay.clock = {
    elapsedMs: 12000,
    runningSince: "2026-09-19T10:00:00Z",
  };
  const before = structuredClone(ctx.row);
  for (const value of [false, true]) {
    const response = await action({ kind: "show_timer", value });
    ctx.row = (await response.json()).row;
    expect(ctx.row.overlay.showTimer).toBe(value);
    expect(ctx.row.overlay.clock).toEqual(before.overlay.clock);
    expect(ctx.row.state).toEqual(before.state);
  }
});

it("records analytics atomically, preserves them on visibility changes and clears undo/reset", async () => {
  ctx.row = (await (await action({ kind: "start_clock" })).json()).row;
  ctx.row = (await (await action({ kind: "point_for", team: "a" })).json()).row;
  expect(ctx.row.overlay.analytics.points).toHaveLength(1);
  const state = structuredClone(ctx.row.state),
    clock = structuredClone(ctx.row.overlay.clock);
  ctx.row = (
    await (await action({ kind: "show_scoreboard", value: false })).json()
  ).row;
  expect(ctx.row.overlay.showScoreboard).toBe(false);
  expect(ctx.row.state).toEqual(state);
  expect(ctx.row.overlay.clock).toEqual(clock);
  expect(ctx.row.overlay.analytics.points).toHaveLength(1);
  ctx.row = (await (await action({ kind: "undo" })).json()).row;
  expect(ctx.row.overlay.analytics.points).toHaveLength(0);
  ctx.row = (await (await action({ kind: "reset" })).json()).row;
  expect(ctx.row.overlay.analytics).toEqual({ baselineMs: 0, points: [] });
  expect(await result({ kind: "show_scoreboard", value: "false" })).toEqual({
    status: 400,
    error: "action_invalid",
  });
});
