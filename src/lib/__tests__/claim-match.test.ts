import { beforeEach, it, expect, vi } from "vitest";
const ctx = vi.hoisted(() => ({
  user: { id: "owner", email: "player@example.com", user_metadata: {} } as any,
  existing: null as string | null,
  token: "draft-secret",
  filters: {} as Record<string, unknown>,
}));
vi.mock("@/lib/supabase-server", () => ({
  serverSupabase: async () => ({
    auth: { getUser: async () => ({ data: { user: ctx.user } }) },
  }),
  serviceSupabase: () => ({
    from: (table: string) => {
      let updating = false;
      const chain: any = {
        select: () => chain,
        eq: (key: string, value: unknown) => {
          if (updating) ctx.filters[key] = value;
          return chain;
        },
        is: (key: string, value: unknown) => {
          ctx.filters[key] = value;
          return chain;
        },
        update: () => {
          updating = true;
          return chain;
        },
        upsert: async () => ({ error: null }),
        single: async () =>
          updating
            ? ctx.filters.draft_token === ctx.token && !ctx.existing
              ? { data: { id: "match" } }
              : { data: null, error: {} }
            : { data: { owner_id: ctx.existing } },
      };
      return chain;
    },
  }),
}));
import { POST } from "@/app/api/matches/[id]/claim/route";
async function claim(draftToken?: string) {
  return POST(
    new Request("http://localhost/api", {
      method: "POST",
      body: JSON.stringify({ draftToken }),
    }),
    { params: Promise.resolve({ id: "match" }) },
  );
}
beforeEach(() => {
  ctx.user = { id: "owner", email: "player@example.com", user_metadata: {} };
  ctx.existing = null;
  ctx.filters = {};
});
it("requires authentication and the original draft token", async () => {
  ctx.user = null;
  expect((await claim("draft-secret")).status).toBe(401);
  ctx.user = { id: "owner" };
  expect((await claim()).status).toBe(403);
  expect((await claim("wrong")).status).toBe(409);
});
it("claims only unowned drafts and tolerates retry by the same owner", async () => {
  expect((await claim("draft-secret")).status).toBe(200);
  expect(ctx.filters.owner_id).toBeNull();
  expect(ctx.filters.status).toBe("draft");
  ctx.existing = "owner";
  expect((await claim()).status).toBe(200);
  ctx.existing = "someone-else";
  expect((await claim("draft-secret")).status).toBe(409);
});
