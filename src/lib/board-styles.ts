// Visual presets are independent of match rules. Names describe inspiration.
export const BOARD_STYLES = [
  {
    id: "padelboard",
    name: "Padelboard",
    note: "Bold & playful",
    accent: "#f5ff36",
    background: "#11120f",
    row: "#1c1d19",
    text: "#fafaf5",
    border: "#3b3d32",
  },
  {
    id: "tour-premier",
    name: "Premier",
    note: "Premier Padel inspired",
    accent: "#dbca91",
    background: "#101b2a",
    row: "#16273b",
    text: "#fffdf4",
    border: "#65705f",
  },
  {
    id: "tour-fip",
    name: "FIP",
    note: "FIP circuit inspired",
    accent: "#bbdbff",
    background: "#f5f8ff",
    row: "#ffffff",
    text: "#123761",
    border: "#d2dfed",
  },
  {
    id: "tour-apt",
    name: "APT",
    note: "APT tour inspired",
    accent: "#ff8b85",
    background: "#11182b",
    row: "#1c2741",
    text: "#ffffff",
    border: "#344565",
  },
  {
    id: "tour-clay",
    name: "Roland-Garros",
    note: "Paris clay inspired",
    accent: "#f1d7ab",
    background: "#174d3d",
    row: "#205e4a",
    text: "#fff9eb",
    border: "#779784",
  },
  {
    id: "custom",
    name: "Custom",
    note: "Build your own",
    accent: "#f5ff36",
    background: "#111827",
    row: "#1f2937",
    text: "#ffffff",
    border: "#445064",
  },
] as const;
export type BoardStyleId = (typeof BOARD_STYLES)[number]["id"];
export function getBoardStyle(id: BoardStyleId) {
  return BOARD_STYLES.find((style) => style.id === id)!;
}
