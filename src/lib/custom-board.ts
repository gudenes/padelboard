export interface CustomBoardDesign {
  background: string;
  rowBackground: string;
  textColor: string;
  borderColor: string;
  scoreBackground: string;
  scoreTextColor: string;
  pointTextColor: string;
  font: "sans" | "serif" | "mono";
  rowHeight: number;
  fontSize: number;
  radius: number;
  width: number;
  showHeader: boolean;
  logo?: string;
  logoText?: string;
  logoHeight?: number;
  showLogo?: boolean;
  scoreSize?: number;
}
export const DEFAULT_CUSTOM_DESIGN: CustomBoardDesign = {
  background: "#111827",
  rowBackground: "#1f2937",
  textColor: "#ffffff",
  borderColor: "#445064",
  scoreBackground: "#e6eaf0",
  scoreTextColor: "#111827",
  pointTextColor: "#111827",
  font: "sans",
  rowHeight: 42,
  fontSize: 17,
  radius: 8,
  width: 460,
  showHeader: true,
  logo: "",
  logoText: "PADELBOARD",
  logoHeight: 20,
  showLogo: true,
  scoreSize: 22,
};
export const BOARD_FONTS = {
  sans: "Arial, sans-serif",
  serif: "Georgia, serif",
  mono: "ui-monospace, monospace",
};
export function resolveCustomDesign(
  input?: Partial<CustomBoardDesign>,
): CustomBoardDesign {
  const design = { ...DEFAULT_CUSTOM_DESIGN, ...input };
  for (const key of [
    "background",
    "rowBackground",
    "textColor",
    "borderColor",
    "scoreBackground",
    "scoreTextColor",
    "pointTextColor",
  ] as const) {
    if (!/^#[0-9a-f]{6}$/i.test(design[key]))
      design[key] = DEFAULT_CUSTOM_DESIGN[key];
  }
  const clamp = (value: number, min: number, max: number, fallback: number) =>
    Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
  design.rowHeight = clamp(design.rowHeight, 28, 64, 42);
  design.fontSize = clamp(design.fontSize, 12, 24, 17);
  design.radius = clamp(design.radius, 0, 20, 8);
  design.width = clamp(design.width, 320, 720, 460);
  design.scoreSize = clamp(
    design.scoreSize ?? 22,
    14,
    Math.min(32, design.rowHeight - 6),
    22,
  );
  design.logoHeight = clamp(design.logoHeight ?? 20, 14, 36, 20);
  design.logoText =
    typeof design.logoText === "string"
      ? design.logoText.slice(0, 40)
      : "PADELBOARD";
  design.logo =
    typeof design.logo === "string" &&
    design.logo.length <= 350000 &&
    /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(
      design.logo,
    )
      ? design.logo
      : "";
  design.showHeader =
    typeof design.showHeader === "boolean" ? design.showHeader : true;
  design.showLogo =
    typeof design.showLogo === "boolean" ? design.showLogo : true;
  if (!(design.font in BOARD_FONTS)) design.font = "sans";
  return design;
}

function luminance(color: string) {
  const rgb = [1, 3, 5]
    .map((i) => parseInt(color.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
export function colorContrast(a: string, b: string) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export function pointPalette(accent: string, design: CustomBoardDesign) {
  const backgrounds = [design.rowBackground, design.scoreBackground];
  const separation = (color: string) =>
    Math.min(...backgrounds.map((bg) => colorContrast(color, bg)));
  let background = /^#[a-f0-9]{6}$/i.test(accent) ? accent : "#f5ff36";
  if (separation(background) < 1.6) {
    background = ["#111827", "#ffffff", "#f5ff36", "#2563eb", "#64748b"].sort(
      (a, b) => separation(b) - separation(a),
    )[0];
  }
  const text =
    colorContrast(design.pointTextColor, background) >= 4.5
      ? design.pointTextColor
      : colorContrast("#ffffff", background) >
          colorContrast("#111111", background)
        ? "#ffffff"
        : "#111111";
  return { background, text };
}
