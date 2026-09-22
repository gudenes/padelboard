import { expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
import Studio from "@/app/[locale]/m/[code]/studio/page";
import Edit from "@/app/[locale]/m/[code]/edit/page";
import Insights from "@/app/[locale]/m/[code]/insights/page";
it.each([
  [Studio, "output=studio"],
  [Edit, "view=edit"],
  [Insights, "view=insights"],
] as const)(
  "keeps existing bookmarks inside the unified workspace (%s)",
  async (page, query) => {
    await expect(
      page({ params: Promise.resolve({ code: "MATCH1" }) }),
    ).rejects.toThrow(`redirect:/m/MATCH1?${query}`);
  },
);
