import { describe, it, expect } from "vitest";
import { parsePlayerProfile } from "../player-profile";
const valid = {
  name: " Ana ",
  role: "player",
  club: " Club ",
  color: "#f5ff36",
  style: "headband",
};
describe("player profile", () => {
  it("trims display information and accepts an optional club", () => {
    expect(parsePlayerProfile(valid).name).toBe("Ana");
    expect(parsePlayerProfile({ ...valid, club: "" }).club).toBe("");
  });
  it.each([
    { name: "" },
    { name: "x".repeat(61) },
    { role: "admin" },
    { club: "x".repeat(81) },
    { style: "<script>" },
    { color: "url(evil)" },
  ])("rejects invalid profile fields %o", (change) => {
    expect(() => parsePlayerProfile({ ...valid, ...change })).toThrow();
  });
});
