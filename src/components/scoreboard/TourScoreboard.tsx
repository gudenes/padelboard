import type { CSSProperties } from "react";
import { TennisBall } from "@phosphor-icons/react/dist/ssr";
import { getBoardStyle, type BoardStyleId } from "@/lib/board-styles";
import {
  BOARD_FONTS,
  boardLayoutWidth,
  resolveCustomDesign,
  pointPalette,
  colorContrast,
  type CustomBoardDesign,
} from "@/lib/custom-board";
import { pointLabel, scoreboardNotice } from "@/lib/scoreboard-labels";
import { ScoreboardNotice } from "./ScoreboardNotice";
import type { MatchState } from "@/lib/padel-scoring";
import type { DoublesPlayers } from "@/lib/doubles";
import "./scoreboard.css";

export function TourScoreboard({
  names,
  players,
  state,
  accent,
  title,
  variant = "padelboard",
  announce = true,
  customDesign,
}: {
  announce?: boolean;
  names: [string, string];
  players?: DoublesPlayers;
  state: MatchState;
  accent: string;
  title: string;
  variant?: BoardStyleId;
  customDesign?: Partial<CustomBoardDesign>;
}) {
  const style = getBoardStyle(variant);
  const custom =
    variant === "custom" ? resolveCustomDesign(customDesign) : null;
  const points = custom ? pointPalette(accent, custom) : null;
  const status = scoreboardNotice(state);
  const variables = {
    "--board-accent": accent,
    "--board-width": `${boardLayoutWidth(variant, customDesign)}px`,
    "--board-serving":
      [accent, "#f5ff36", "#007346", "#005fcc", "#b5005c"].find(
        (c) =>
          colorContrast(c, custom?.rowBackground ?? style.row) >= 4.5 &&
          c.toLowerCase() !== (custom?.textColor ?? style.text).toLowerCase(),
      ) ||
      (custom?.textColor ?? style.text),
    "--board-bg": custom?.background ?? style.background,
    "--board-row": custom?.rowBackground ?? style.row,
    "--board-text": custom?.textColor ?? style.text,
    "--board-border": custom?.borderColor ?? style.border,
    ...(custom
      ? {
          "--board-font": BOARD_FONTS[custom.font],
          "--board-row-height": `${custom.rowHeight}px`,
          "--board-name-size": `${custom.fontSize}px`,
          "--board-radius": `${custom.radius}px`,
          "--board-score-bg": custom.scoreBackground,
          "--board-score-text": custom.scoreTextColor,
          "--board-point-text": points!.text,
          "--board-point-bg": points!.background,
          "--board-score-size": `${custom.scoreSize}px`,
          "--board-logo-height": `${custom.logoHeight}px`,
        }
      : {}),
  } as CSSProperties;
  return (
    <div className={`pb-scoreboard pb-board-${variant}`} style={variables}>
      {(!custom || custom.showHeader) && (
        <div className="pb-board-header">
          <span className="pb-board-brand">
            {(!custom || custom.showLogo) &&
              (custom?.logo ? (
                <img
                  src={custom.logo}
                  alt={custom.logoText || "Club logo"}
                  className="pb-board-logo"
                />
              ) : (
                <>
                  <TennisBall weight="bold" />{" "}
                  {custom?.logoText || "PADELBOARD"}
                </>
              ))}
          </span>
          <span>{title || "YOUR MATCH"}</span>
        </div>
      )}
      <div className="pb-score-rows" aria-live={announce ? "polite" : "off"} aria-atomic="true">
        {(["a", "b"] as const).map((team, i) => {
          const pair =
            players?.[i * 2] || players?.[i * 2 + 1]
              ? [players[i * 2] || "Player 1", players[i * 2 + 1] || "Player 2"]
              : (names[i] || `Pair ${i + 1}`).split(" / ");
          return (
            <div className="pb-score-row" key={team}>
              <span className="pb-player-name">
                <span className="pb-pair-names" title={pair.join(" / ")}>
                  {pair.map((name, n) => (
                    <span className="pb-player-part" key={n}>
                      {n > 0 && <span className="pb-name-divider">/</span>}
                      <span
                        className={`pb-player-label ${state.servingTeam === team && Math.floor(state.servingPlayer / 2) === n ? "is-serving" : ""}`}
                        aria-label={
                          state.servingTeam === team &&
                          Math.floor(state.servingPlayer / 2) === n
                            ? `${name}, serving`
                            : undefined
                        }
                      >
                        {name}
                      </span>
                    </span>
                  ))}
                </span>
                <span
                  className="pb-serve-slot"
                  aria-hidden={state.servingTeam !== team}
                >
                  {state.servingTeam === team && (
                    <TennisBall
                      weight="fill"
                      className="pb-serve"
                      aria-label="Serving pair"
                    />
                  )}
                </span>
              </span>
              <span className="pb-set-group">
                {state.sets.map((set, n) => (
                  <span className="pb-set" key={n}>
                    {set[team]}
                  </span>
                ))}
              </span>
              <span
                className={`pb-points ${i === 0 ? "pb-points-accent" : ""} ${pointLabel(state,team).length > 2 ? "pb-points-long" : ""}`}
              >
                {pointLabel(state, team)}
              </span>
            </div>
          );
        })}
      </div>
      <ScoreboardNotice label={status} />
    </div>
  );
}
