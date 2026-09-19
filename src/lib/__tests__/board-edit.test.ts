import { it, expect } from "vitest";
import { parseBoardEdit } from "../board-edit";
const body = {
  template: "custom",
  accent: "#ff95c7",
  tournamentName: " Final ",
  position: "top-left",
  scale: 1,
  showTimer: true,
  customDesign: {
    logo: "https://example.com/unsafe.svg",
    background: "#123456",
  },
};
it("accepts design fields but strips match runtime and untrusted logo URLs", () => {
  const result = parseBoardEdit({
    ...body,
    clock: { elapsedMs: 0 },
    scoreHistory: [],
    state: {},
  });
  expect(result.tournamentName).toBe("Final");
  expect(result.customDesign?.background).toBe("#123456");
  expect(result.customDesign?.logo).toBe("");
  expect(result).not.toHaveProperty("clock");
  expect(result).not.toHaveProperty("scoreHistory");
  expect(result).not.toHaveProperty("state");
});
it.each([
  { template: "bad" },
  { accent: "red" },
  { scale: NaN },
  { scale: 3 },
  { position: "center" },
  { showTimer: "yes" },
  { tournamentName: "x".repeat(101) },
])("rejects invalid design %o", (patch) =>
  expect(() => parseBoardEdit({ ...body, ...patch })).toThrow(),
);
