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
/** Estado + código estável: a resposta nunca leva prosa inglesa. */
const result = async (draftToken?: string) => {
  const response = await claim(draftToken);
  return { status: response.status, error: (await response.json()).error };
};
it("requires authentication and the original draft token", async () => {
  ctx.user = null;
  expect(await result("draft-secret")).toEqual({
    status: 401,
    error: "sign_in_to_claim",
  });
  ctx.user = { id: "owner" };
  expect(await result()).toEqual({
    status: 403,
    error: "claim_token_required",
  });
  expect(await result("wrong")).toEqual({ status: 409, error: "claim_failed" });
});
it("claims only unowned drafts and tolerates retry by the same owner", async () => {
  expect((await claim("draft-secret")).status).toBe(200);
  expect(ctx.filters.owner_id).toBeNull();
  expect(ctx.filters.status).toBe("draft");
  ctx.existing = "owner";
  expect((await claim()).status).toBe(200);
  ctx.existing = "someone-else";
  const blocked = await claim("draft-secret");
  expect(blocked.status).toBe(409);
  expect((await blocked.json()).error).toBe("claim_failed");
});
