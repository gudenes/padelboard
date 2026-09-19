import { describe, expect, it } from "vitest";
import { doublesTeams } from "../doubles";
import {
  DEFAULT_CUSTOM_DESIGN,
  resolveCustomDesign,
  pointPalette,
  colorContrast,
} from "../custom-board";

describe("doubles setup", () => {
  it("stores four separate trimmed players and derives slash-separated pair names", () => {
    expect(doublesTeams([" Alex ", "Sam", "Jo", "Lee"])).toEqual({
      a: { name: "Alex / Sam", players: ["Alex", "Sam"] },
      b: { name: "Jo / Lee", players: ["Jo", "Lee"] },
    });
  });
  it("does not parse or split punctuation inside a player name", () => {
    expect(doublesTeams(["A/B", "Sam", "Jo", "Lee"]).a.players).toEqual([
      "A/B",
      "Sam",
    ]);
  });
});
describe("saved custom board designs", () => {
  it("retains appearance and compact layout across JSON persistence", () => {
    const saved = JSON.parse(
      JSON.stringify({
        ...DEFAULT_CUSTOM_DESIGN,
        background: "#173f37",
        font: "serif",
        rowHeight: 28,
        showHeader: false,
        width: 600,
      }),
    );
    expect(resolveCustomDesign(saved)).toEqual(saved);
  });
  it("fills old or incomplete designs and constrains invalid saved values", () => {
    const result = resolveCustomDesign({
      background: "invalid",
      rowHeight: 0,
      width: 10000,
      fontSize: NaN,
    });
    expect(result.background).toBe(DEFAULT_CUSTOM_DESIGN.background);
    expect(result.rowHeight).toBe(28);
    expect(result.width).toBe(720);
    expect(result.fontSize).toBe(17);
    expect(result.showHeader).toBe(true);
    expect(DEFAULT_CUSTOM_DESIGN.rowHeight).toBe(42);
  });
});

describe("custom branding and point hierarchy", () => {
  it("keeps logo controls through JSON persistence and rejects external or SVG image URLs", () => {
    const logo = "data:image/png;base64,iVBORw0KGgo=";
    const saved = {
      ...DEFAULT_CUSTOM_DESIGN,
      logo,
      logoText: "My club",
      showHeader: false,
      showLogo: false,
      logoHeight: 24,
      scoreSize: 20,
    };
    expect(resolveCustomDesign(JSON.parse(JSON.stringify(saved)))).toEqual(
      saved,
    );
    expect(
      resolveCustomDesign({ logo: "https://example.com/logo.png" }).logo,
    ).toBe("");
    expect(
      resolveCustomDesign({ logo: "data:image/svg+xml;base64,AAAA" }).logo,
    ).toBe("");
  });
  it("keeps point cells distinct and point text readable even with identical AI colors", () => {
    const design = {
      ...DEFAULT_CUSTOM_DESIGN,
      rowBackground: "#0455bf",
      scoreBackground: "#0455bf",
      pointTextColor: "#0455bf",
    };
    const points = pointPalette("#0455bf", design);
    expect(
      colorContrast(points.background, design.scoreBackground),
    ).toBeGreaterThanOrEqual(1.6);
    expect(
      colorContrast(points.text, points.background),
    ).toBeGreaterThanOrEqual(4.5);
  });
  it("fits number size inside short rows", () => {
    expect(
      resolveCustomDesign({ rowHeight: 28, scoreSize: 32 }).scoreSize,
    ).toBe(22);
  });
});
