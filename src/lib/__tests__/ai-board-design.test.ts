import { afterEach, describe, expect, it, vi } from "vitest";
import {
  logoDataUrl,
  parseGeneratedBoard,
  websiteUrl,
} from "../ai-board-design";
import { DEFAULT_CUSTOM_DESIGN, colorContrast } from "../custom-board";
import { POST } from "../../app/api/board-design/route";
import { readWebsiteBrand } from "../website-brand";

vi.mock("../website-brand", () => ({
  readWebsiteBrand: vi.fn(async () => null),
}));

const suggestion = {
  sourceUsable: true,
  name: "Club night",
  reasoning: "A bright club-inspired accent.",
  accent: "#ffff00",
  design: { ...DEFAULT_CUSTOM_DESIGN, pointTextColor: "#ffff00" },
};
const logo =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1ZkAAAAASUVORK5CYII=";
const request = (body: unknown, ip = "test") =>
  new Request("http://localhost:3003/api/board-design", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("brand inputs and design validation", () => {
  it("normalizes public sites and strips query secrets", () => {
    expect(websiteUrl("club.example.com/path?token=secret#section").href).toBe(
      "https://club.example.com/path",
    );
  });
  it.each([
    "http://example.com",
    "https://localhost",
    "https://127.0.0.1",
    "https://[::1]",
    "https://example.com:8443",
    "https://user:pass@example.com",
    "https://club.internal",
  ])("rejects unsafe website %s", (url) => {
    expect(() => websiteUrl(url)).toThrow();
  });
  it("accepts raster image signatures and rejects disguised files", () => {
    expect(logoDataUrl(logo)).toBe(logo);
    expect(() => logoDataUrl("data:image/png;base64,SGVsbG8=")).toThrow();
    expect(() => logoDataUrl("data:image/svg+xml;base64,PHN2Zz4=")).toThrow();
  });
  it("rejects unusable sources and malformed model data", () => {
    expect(() =>
      parseGeneratedBoard({ ...suggestion, sourceUsable: false }, []),
    ).toThrow("source_unavailable");
    expect(() =>
      parseGeneratedBoard(
        { ...suggestion, design: { ...suggestion.design, fontSize: "large" } },
        [],
      ),
    ).toThrow("invalid_result");
  });
  it("repairs low contrast and clamps model dimensions", () => {
    const result = parseGeneratedBoard(
      { ...suggestion, design: { ...suggestion.design, width: 900 } },
      [],
    );
    expect(
      colorContrast(result.design.pointTextColor, result.accent),
    ).toBeGreaterThanOrEqual(4.5);
    expect(result.design.width).toBe(720);
  });
});
describe("OpenAI route", () => {
  it("explains missing server credentials without a provider request", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect((await POST(request({ kind: "logo", image: logo }))).status).toBe(
      503,
    );
    expect(fetch).not.toHaveBeenCalled();
  });
  it("generates a logo-based editable design using the Responses API", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const fetch = vi.fn().mockResolvedValue(
      Response.json({
        status: "completed",
        output: [
          {
            type: "message",
            content: [
              { type: "output_text", text: JSON.stringify(suggestion) },
            ],
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetch);
    const response = await POST(
      request({ kind: "logo", image: logo }, "logo-success"),
    );
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(
      colorContrast(result.design.pointTextColor, result.accent),
    ).toBeGreaterThanOrEqual(4.5);
    expect(result.design.logo).toBe(logo);
    const sent = JSON.parse(fetch.mock.calls[0][1].body);
    expect(sent.store).toBe(false);
    expect(sent.input[0].content[1].image_url).toBe(logo);
    expect(sent.text.format.strict).toBe(true);
  });
  it("requires actual same-domain search evidence for website results", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          status: "completed",
          output: [
            {
              type: "message",
              content: [
                { type: "output_text", text: JSON.stringify(suggestion) },
              ],
            },
          ],
        }),
      ),
    );
    expect(
      (
        await POST(
          request({ kind: "website", url: "example.com" }, "no-evidence"),
        )
      ).status,
    ).toBe(502);
  });
  it("uses directly read brand content without paying for web search", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.mocked(readWebsiteBrand).mockResolvedValueOnce({
      url: "https://example.com/",
      text: "Example Padel Club",
      colors: ["--brand-primary:#0455BF"],
    });
    const fetch = vi.fn().mockResolvedValue(
      Response.json({
        status: "completed",
        output: [
          {
            type: "message",
            content: [
              { type: "output_text", text: JSON.stringify(suggestion) },
            ],
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetch);
    const response = await POST(
      request({ kind: "website", url: "example.com" }, "direct-site"),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).sources).toEqual(["https://example.com/"]);
    const sent = JSON.parse(fetch.mock.calls[0][1].body);
    expect(sent.tools).toBeUndefined();
    expect(sent.input[0].content[0].text).toContain("#0455BF");
  });
  it("returns source links alongside site-inspired designs", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          status: "completed",
          output: [
            {
              type: "web_search_call",
              action: { sources: [{ url: "https://example.com/about" }] },
            },
            {
              type: "message",
              content: [
                { type: "output_text", text: JSON.stringify(suggestion) },
              ],
            },
          ],
        }),
      ),
    );
    const response = await POST(
      request({ kind: "website", url: "example.com" }, "website-success"),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).sources).toEqual([
      "https://example.com/about",
    ]);
  });
  it("does not leak provider errors or secrets", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ error: "secret provider detail" }, { status: 401 }),
        ),
    );
    const response = await POST(
      request({ kind: "logo", image: logo }, "provider-error"),
    );
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("secret provider detail");
  });
  it("rejects cross-origin and malformed input before calling OpenAI", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const cross = request({ kind: "logo", image: logo });
    cross.headers.set("origin", "https://unrelated.example");
    expect((await POST(cross)).status).toBe(403);
    expect(
      (await POST(request({ kind: "logo", image: "invalid" }))).status,
    ).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
});
