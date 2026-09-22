import { useTranslations } from "next-intl";
import { TourScoreboard } from "@/components/scoreboard/TourScoreboard";
import { getBoardStyle, BOARD_STYLES } from "@/lib/board-styles";
import type { MatchRow } from "@/types/match";
export function BoardPreview({ row }: { row: MatchRow }) {
  const t = useTranslations("workspace");
  const style = getBoardStyle(
    BOARD_STYLES.find((s) => s.id === row.overlay.template)?.id || "padelboard",
  );
  return (
    <TourScoreboard
      names={[row.teams.a.name, row.teams.b.name]}
      players={[...row.teams.a.players, ...row.teams.b.players]}
      state={row.state}
      accent={row.overlay.customColors?.accent?.color || style.accent}
      title={row.overlay.tournamentName || t("boardPreviewFallbackTitle")}
      variant={style.id}
      customDesign={row.overlay.customDesign}
    />
  );
}
