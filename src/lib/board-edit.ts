import { BOARD_STYLES } from "./board-styles";
import { resolveCustomDesign } from "./custom-board";
import type { OverlayJson } from "@/types/match";
export function parseBoardEdit(body: unknown): Partial<OverlayJson> {
  const v = body as Record<string, unknown> | null;
  if (!v || !BOARD_STYLES.some((s) => s.id === v.template))
    throw new Error("Choose a board template.");
  if (typeof v.accent !== "string" || !/^#[a-f0-9]{6}$/i.test(v.accent))
    throw new Error("Choose a valid color.");
  if (typeof v.tournamentName !== "string" || v.tournamentName.length > 100)
    throw new Error("Match title must be under 100 characters.");
  if (
    !["top-left", "top-right", "bottom-left", "bottom-right"].includes(
      String(v.position),
    )
  )
    throw new Error("Choose a scoreboard position.");
  if (
    typeof v.scale !== "number" ||
    !Number.isFinite(v.scale) ||
    v.scale < 0.5 ||
    v.scale > 2
  )
    throw new Error("Choose a size between 50% and 200%.");
  if (typeof v.showTimer !== "boolean")
    throw new Error("Invalid timer setting.");
  const custom = resolveCustomDesign(
    v.customDesign && typeof v.customDesign === "object" ? v.customDesign : {},
  );
  // Resolve then explicitly pick known fields; never accept clock/history from this endpoint.
  const keys = [
    "background",
    "rowBackground",
    "textColor",
    "borderColor",
    "scoreBackground",
    "scoreTextColor",
    "pointTextColor",
    "font",
    "rowHeight",
    "fontSize",
    "radius",
    "width",
    "showHeader",
    "logo",
    "logoText",
    "logoHeight",
    "showLogo",
    "scoreSize",
  ] as const;
  const customDesign = Object.fromEntries(
    keys.map((k) => [k, custom[k]]),
  ) as unknown as typeof custom;
  return {
    template: v.template as OverlayJson["template"],
    customColors: { accent: { color: v.accent } },
    tournamentName: v.tournamentName.trim(),
    customDesign,
    position: v.position as OverlayJson["position"],
    scale: v.scale,
    showTimer: v.showTimer,
  };
}
