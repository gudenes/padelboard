import { expect, it } from "vitest";
import { boardLayoutWidth } from "../custom-board";
it("keeps custom width unchanged when moving between rendering surfaces", () => {
  expect(boardLayoutWidth("custom", {width: 460})).toBe(460);
  expect(boardLayoutWidth("custom", {width: 720})).toBe(720);
});
it("uses the compact preset width without applying stored custom settings", () => {
  expect(boardLayoutWidth("tour-premier", {width: 720})).toBe(360);
  expect(boardLayoutWidth("custom")).toBe(360);
});
