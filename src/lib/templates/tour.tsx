import { AnimatedMatchTime } from "@/components/workspace/AnimatedMatchTime";
import { boardLayoutWidth } from "@/lib/custom-board";
import { BOARD_STYLES } from "@/lib/board-styles";
import { TourScoreboard } from "@/components/scoreboard/TourScoreboard";
import type { Template } from "./types";

export const tourTemplates: Template[] = BOARD_STYLES.map((style) => ({
  id: style.id,
  name: style.name,
  description: style.note,
  defaults: { colors: { accent: { color: style.accent } } },
  slots: [{ key: "accent", label: "Score accent", fields: ["color"] }],
  Renderer: ({ row, colors }) => (
    <div
      style={{
        position: "absolute",
        width: boardLayoutWidth(style.id, row.overlay.customDesign),
        top: row.overlay.position.startsWith("top") ? 20 : undefined,
        bottom: row.overlay.position.startsWith("bottom") ? 20 : undefined,
        left: row.overlay.position.endsWith("left") ? 20 : undefined,
        right: row.overlay.position.endsWith("right") ? 20 : undefined,
        transform: `scale(${row.overlay.scale})`,
        transformOrigin: row.overlay.position.replace("-", " "),
      }}
    >
      <TourScoreboard
        names={[row.teams.a.name, row.teams.b.name]}
        players={[...row.teams.a.players, ...row.teams.b.players]}
        state={row.state}
        accent={colors.accent.color}
        variant={style.id}
        customDesign={row.overlay.customDesign}
        title={
          row.overlay.showTournament
            ? [row.overlay.tournamentName, row.overlay.round]
                .filter(Boolean)
                .join(" · ")
            : ""
        }
      />
      <AnimatedMatchTime row={row} />
    </div>
  ),
}));
