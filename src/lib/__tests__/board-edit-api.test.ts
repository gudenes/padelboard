import { beforeEach, it, expect, vi } from "vitest";
import { defaultOverlay } from "@/types/match";
const ctx = vi.hoisted(() => ({
  user: { id: "owner" } as { id: string } | null,
  row: {} as any,
  patch: {} as any,
  conflict: false,
}));
vi.mock("@/lib/supabase-server", () => ({
  serverSupabase: async () => ({
    auth: { getUser: async () => ({ data: { user: ctx.user } }) },
  }),
  serviceSupabase: () => ({
    from: () => {
      let owner = "";
      const chain: any = {
        select: () => chain,
        eq: (k: string, v: string) => {
          if (k === "owner_id") owner = v;
          return chain;
        },
        single: async () => ({
          data: owner === ctx.row.owner_id ? ctx.row : null,
        }),
        update: (v: unknown) => {
          ctx.patch = v;
          return chain;
        },
        maybeSingle: async () => {
          if (ctx.conflict) {
            ctx.conflict = false;
            ctx.row.overlay.clock.elapsedMs = 5000;
            return { data: null, error: null };
          }
          return { data: { ...ctx.row, ...ctx.patch }, error: null };
        },
      };
      return chain;
    },
  }),
}));
import { PATCH } from "@/app/api/matches/[id]/design/route";
const body = {
  template: "tour-fip",
  accent: "#ff95c7",
  tournamentName: "New title",
  position: "bottom-right",
  scale: 1.2,
  showTimer: true,
};
const save = () =>
  PATCH(
    new Request("http://localhost/api", {
      method: "PATCH",
      body: JSON.stringify({
        ...body,
        state: { phase: "finished" },
        clock: { elapsedMs: 0 },
      }),
    }),
    { params: Promise.resolve({ id: "match" }) },
  );
beforeEach(() => {
  ctx.user = { id: "owner" };
  ctx.conflict = false;
  ctx.patch = {};
  ctx.row = {
    id: "match",
    owner_id: "owner",
    updated_at: "now",
    state: { currentGame: { a: 30, b: 15 } },
    overlay: {
      ...defaultOverlay(),
      clock: { elapsedMs: 4000, runningSince: "now" },
      scoreHistory: [{ marker: "previous point" }],
    },
  };
});
/** Estado + código estável: a resposta nunca leva prosa inglesa. */
const result = async () => {
  const response = await save();
  return { status: response.status, error: (await response.json()).error };
};
it("requires an owner session", async () => {
  ctx.user = null;
  expect(await result()).toEqual({ status: 401, error: "sign_in_required" });
  ctx.user = { id: "other" };
  expect(await result()).toEqual({ status: 404, error: "match_not_found" });
  expect(ctx.patch).toEqual({});
});
it("reports the invalid field as a code", async () => {
  const response = await PATCH(
    new Request("http://localhost/api", {
      method: "PATCH",
      body: JSON.stringify({ ...body, accent: "not-a-color" }),
    }),
    { params: Promise.resolve({ id: "match" }) },
  );
  expect(response.status).toBe(400);
  expect((await response.json()).error).toBe("board_color_invalid");
});
it("changes only design, preserving points, undo history and clock", async () => {
  const r = await save();
  expect(r.status).toBe(200);
  expect(Object.keys(ctx.patch)).toEqual(["overlay"]);
  const { row } = await r.json();
  expect(row.state.currentGame).toEqual({ a: 30, b: 15 });
  expect(row.overlay.clock.elapsedMs).toBe(4000);
  expect(row.overlay.scoreHistory).toHaveLength(1);
  expect(row.overlay.template).toBe("tour-fip");
});
it("re-reads runtime after a concurrent scoring update", async () => {
  ctx.conflict = true;
  const r = await save();
  expect(r.status).toBe(200);
  expect((await r.json()).row.overlay.clock.elapsedMs).toBe(5000);
});
