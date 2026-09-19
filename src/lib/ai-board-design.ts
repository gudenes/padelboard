import {
  resolveCustomDesign,
  pointPalette,
  type CustomBoardDesign,
} from "./custom-board";

export interface GeneratedBoard {
  name: string;
  reasoning: string;
  accent: string;
  design: CustomBoardDesign;
  sources: string[];
}
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;
export function websiteUrl(value: string): URL {
  const url = new URL(value.includes("://") ? value : `https://${value}`);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(url.hostname) ||
    /\.(localhost|local|internal|test|invalid)$/i.test(url.hostname)
  ) {
    throw new Error("Enter a public HTTPS website, such as yourclub.com.");
  }
  url.hash = "";
  url.search = "";
  return url;
}
export function logoDataUrl(value: string): string {
  const match =
    /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) throw new Error("Choose a PNG, JPG or WebP logo.");
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > MAX_LOGO_BYTES)
    throw new Error("Choose a logo smaller than 2 MB.");
  const valid =
    match[1] === "png"
      ? bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : match[1] === "jpeg"
        ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : bytes.toString("ascii", 0, 4) === "RIFF" &&
          bytes.toString("ascii", 8, 12) === "WEBP";
  if (!valid) throw new Error("This file is not a supported image.");
  return value;
}
const hex = { type: "string", pattern: "^#[0-9a-fA-F]{6}$" };
const properties = {
  background: hex,
  rowBackground: hex,
  textColor: hex,
  borderColor: hex,
  scoreBackground: hex,
  scoreTextColor: hex,
  pointTextColor: hex,
  font: { type: "string", enum: ["sans", "serif", "mono"] },
  rowHeight: { type: "number", minimum: 28, maximum: 64 },
  fontSize: { type: "number", minimum: 12, maximum: 24 },
  radius: { type: "number", minimum: 0, maximum: 20 },
  width: { type: "number", minimum: 320, maximum: 720 },
  showHeader: { type: "boolean" },
};
export const boardDesignSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    sourceUsable: { type: "boolean" },
    name: { type: "string" },
    reasoning: { type: "string" },
    accent: hex,
    design: {
      type: "object",
      additionalProperties: false,
      properties,
      required: Object.keys(properties),
    },
  },
  required: ["sourceUsable", "name", "reasoning", "accent", "design"],
};
function luminance(hex: string) {
  const rgb = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function readable(text: string, backgrounds: string[]) {
  const contrast = (fg: string, bg: string) =>
    (Math.max(luminance(fg), luminance(bg)) + 0.05) /
    (Math.min(luminance(fg), luminance(bg)) + 0.05);
  if (backgrounds.every((bg) => contrast(text, bg) >= 4.5)) return text;
  if (
    backgrounds.every(
      (bg) =>
        (Math.max(luminance("#111111"), luminance(bg)) + 0.05) /
          (Math.min(luminance("#111111"), luminance(bg)) + 0.05) >=
        4.5,
    )
  )
    return "#111111";
  return ["#ffffff", "#000000"].sort(
    (a, b) =>
      Math.min(...backgrounds.map((bg) => contrast(b, bg))) -
      Math.min(...backgrounds.map((bg) => contrast(a, bg))),
  )[0];
}
export function parseGeneratedBoard(
  value: unknown,
  sources: string[],
): GeneratedBoard {
  if (!value || typeof value !== "object") throw new Error("invalid_result");
  const v = value as Record<string, unknown>;
  if (v.sourceUsable !== true) throw new Error("source_unavailable");
  if (
    typeof v.name !== "string" ||
    typeof v.reasoning !== "string" ||
    typeof v.accent !== "string" ||
    !/^#[a-f0-9]{6}$/i.test(v.accent) ||
    !v.design ||
    typeof v.design !== "object"
  )
    throw new Error("invalid_result");
  const raw = v.design as Record<string, unknown>;
  for (const key of Object.keys(properties)) {
    const schema = properties[key as keyof typeof properties];
    if (typeof raw[key] !== schema.type) throw new Error("invalid_result");
    if ("pattern" in schema && !/^#[a-f0-9]{6}$/i.test(raw[key] as string))
      throw new Error("invalid_result");
  }
  const design = resolveCustomDesign(raw as unknown as CustomBoardDesign);
  // The header and names share one text color; guarantee readable rows too.
  design.textColor = readable(design.textColor, [design.background]);
  const contrast = (a: string, b: string) =>
    (Math.max(luminance(a), luminance(b)) + 0.05) /
    (Math.min(luminance(a), luminance(b)) + 0.05);
  if (contrast(design.textColor, design.rowBackground) < 4.5)
    design.rowBackground = design.background;
  design.scoreTextColor = readable(design.scoreTextColor, [
    design.scoreBackground,
  ]);
  design.pointTextColor = readable(design.pointTextColor, [v.accent]);
  const points = pointPalette(v.accent, design);
  design.pointTextColor = points.text;
  return {
    name: v.name.slice(0, 60),
    reasoning: v.reasoning.slice(0, 500),
    accent: points.background,
    design,
    sources,
  };
}
