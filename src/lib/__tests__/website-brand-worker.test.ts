import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("node:dns/promises", () => ({ lookup: vi.fn(), resolve4: vi.fn() }));
import { resolve4 } from "node:dns/promises";
import { readWebsiteBrand } from "../website-brand";
const dns = vi.mocked(resolve4);
const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubEnv("CLOUDFLARE_WORKER", "1");
  vi.stubGlobal("fetch", fetchMock);
  dns.mockResolvedValue(["8.8.8.8"] as never);
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetAllMocks(); });
it("reads a public brand through Worker fetch", async () => {
  fetchMock.mockResolvedValue(new Response(`<h1>Padel club</h1><p>${"Our courts and community. ".repeat(10)}</p>`, {headers:{"content-type":"text/html"}}));
  expect((await readWebsiteBrand(new URL("https://example.com")))?.text).toContain("Padel club");
});
it("checks redirected destinations before fetching private addresses", async () => {
  dns.mockResolvedValueOnce(["8.8.8.8"] as never).mockResolvedValueOnce(["127.0.0.1"] as never);
  fetchMock.mockResolvedValue(new Response(null,{status:302,headers:{location:"https://private.example.com"}}));
  expect(await readWebsiteBrand(new URL("https://example.com"))).toBeNull();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it("limits downloaded HTML size", async () => {
  fetchMock.mockResolvedValue(new Response("x".repeat(1_000_001), {headers:{"content-type":"text/html"}}));
  expect(await readWebsiteBrand(new URL("https://example.com"))).toBeNull();
});
