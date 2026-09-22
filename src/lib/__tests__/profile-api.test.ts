import { beforeEach, it, expect, vi } from "vitest";
const ctx = vi.hoisted(() => ({
  user: { id: "owner" } as { id: string } | null,
  upsert: vi.fn(),
  updateUser: vi.fn(),
}));
vi.mock("@/lib/supabase-server", () => ({
  serverSupabase: async () => ({
    auth: {
      getUser: async () => ({ data: { user: ctx.user } }),
      updateUser: ctx.updateUser,
    },
    from: () => ({ upsert: ctx.upsert }),
  }),
}));
import { POST } from "@/app/api/profile/route";
const valid = {
  id: "someone-else",
  name: "Ana",
  role: "club",
  club: "Local club",
  color: "#f5ff36",
  style: "cap",
};
const request = (body: unknown) =>
  POST(
    new Request("http://localhost/api/profile", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
/** Estado + código estável: a resposta nunca leva prosa inglesa. */
const result = async (body: unknown) => {
  const response = await request(body);
  return { status: response.status, error: (await response.json()).error };
};
beforeEach(() => {
  ctx.user = { id: "owner" };
  ctx.upsert.mockReset().mockResolvedValue({ error: null });
  ctx.updateUser.mockReset().mockResolvedValue({ error: null });
});
it("rejects unauthenticated writes", async () => {
  ctx.user = null;
  expect(await result(valid)).toEqual({
    status: 401,
    error: "sign_in_required",
  });
  expect(ctx.upsert).not.toHaveBeenCalled();
});
it("always saves to the authenticated user and persists the avatar", async () => {
  expect((await request(valid)).status).toBe(200);
  expect(ctx.upsert).toHaveBeenCalledWith({
    id: "owner",
    name: "Ana",
    role: "club",
  });
  expect(ctx.updateUser.mock.calls[0][0].data.padelboard_profile).toMatchObject(
    { style: "cap", color: "#f5ff36", completed: true },
  );
});
it("does not mark onboarding complete when the profile write fails", async () => {
  ctx.upsert.mockResolvedValue({ error: {} });
  expect(await result(valid)).toEqual({
    status: 500,
    error: "profile_save_failed",
  });
  expect(ctx.updateUser).not.toHaveBeenCalled();
});
it("reports metadata failures so the user can retry", async () => {
  ctx.updateUser.mockResolvedValue({ error: {} });
  expect(await result(valid)).toEqual({
    status: 500,
    error: "avatar_save_failed",
  });
});
it("rejects invalid fields before writing", async () => {
  expect(await result({ ...valid, role: "admin" })).toEqual({
    status: 400,
    error: "profile_role_required",
  });
  expect(ctx.upsert).not.toHaveBeenCalled();
});
