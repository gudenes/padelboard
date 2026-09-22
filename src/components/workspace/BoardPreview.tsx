import { TourScoreboard } from "@/components/scoreboard/TourScoreboard";
import { getBoardStyle, BOARD_STYLES } from "@/lib/board-styles";
import type { MatchRow } from "@/types/match";
export function BoardPreview({ row }: { row: MatchRow }) {
  const style = getBoardStyle(
    BOARD_STYLES.find((s) => s.id === row.overlay.template)?.id || "padelboard",
  );
  return (
    <TourScoreboard
      names={[row.teams.a.name, row.teams.b.name]}
      players={[...row.teams.a.players, ...row.teams.b.players]}
      state={row.state}
      accent={row.overlay.customColors?.accent?.color || style.accent}
      // Sem fallback próprio: o texto do placar tem uma só fonte de verdade,
      // o TourScoreboard. Traduzi-lo aqui faria o preview mostrar "SUA PARTIDA"
      // enquanto o overlay no OBS mostra "YOUR MATCH" — o preview existe para
      // mostrar o que vai para o ar, e passaria a mentir.
      title={row.overlay.tournamentName ?? ""}
      variant={style.id}
      customDesign={row.overlay.customDesign}
    />
  );
}
