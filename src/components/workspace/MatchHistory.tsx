"use client";
import { useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MagnifyingGlass, TennisBall, Trophy, X } from "@phosphor-icons/react";
import type { MatchRow } from "@/types/match";
import { pointLabel } from "@/lib/scoreboard-labels";
import {
  matchesSearch,
  matchStatusId,
  type MatchStatusId,
} from "@/lib/match-search";
import { MatchDuration } from "./MatchDuration";
/** O id persistido escolhe a etiqueta; a pesquisa continua a indexar o inglês. */
const STATUS_KEYS: Record<MatchStatusId, string> = {
  finished: "statusFinished",
  abandoned: "statusAbandoned",
  draft: "statusDraft",
  live: "statusLive",
  paused: "statusPaused",
  ready: "statusReady",
};
export function MatchHistory({ rows }: { rows: MatchRow[] }) {
  const t = useTranslations("workspace");
  const [filter, setFilter] = useState<"active" | "history" | "all">("active");
  const [query, setQuery] = useState("");
  const locale = useLocale();
  const format = useFormatter();
  const filtered = rows.filter(
    (r) =>
      (filter === "all" ||
        (filter === "active"
          ? !["finished", "abandoned"].includes(r.status)
          : ["finished", "abandoned"].includes(r.status))) &&
      matchesSearch(r, query, locale),
  );
  return (
    <>
      <div className="pbw-history-toolbar">
        <div className="pbw-tabs" aria-label={t("historyFiltersAria")}>
          {(["active", "history", "all"] as const).map((f) => (
            <button
              key={f}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f === "active"
                ? t("historyFilterActive")
                : f === "history"
                  ? t("historyFilterHistory")
                  : t("historyFilterAll")}
            </button>
          ))}
        </div>
        <div className="pbw-match-search" role="search">
          <MagnifyingGlass size={20} aria-hidden="true" />
          <input
            type="search"
            aria-label={t("historySearchAria")}
            placeholder={t("historySearchPlaceholder")}
            value={query}
            onChange={(e) => {
              if (!query.trim() && e.target.value.trim()) setFilter("all");
              setQuery(e.target.value);
            }}
          />
          {query && (
            <button
              type="button"
              aria-label={t("historyClearSearchAria")}
              onClick={() => setQuery("")}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
      <p className="pbw-search-count" role="status">
        {t("historyCount", {
          count: filtered.length,
          hasQuery: query.trim() ? "true" : "false",
          query: query.trim(),
        })}
      </p>
      {!filtered.length ? (
        <section className="pbw-card pbw-empty">
          <h2>
            {query.trim()
              ? t("historyEmptySearchTitle")
              : filter === "history"
                ? t("historyEmptyHistoryTitle")
                : t("historyEmptyActiveTitle")}
          </h2>
          <p>
            {query.trim()
              ? t("historyEmptySearchBody")
              : filter === "history"
                ? t("historyEmptyHistoryBody")
                : t("historyEmptyActiveBody")}
          </p>
          {query.trim() ? (
            <button
              className="pbw-secondary"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              {t("historyClearSearch")}
            </button>
          ) : (
            <Link className="pbw-primary" href="/dashboard/new">
              {t("historyCreateBoard")}
            </Link>
          )}
        </section>
      ) : (
        <div className="pbw-match-list pbw-scorecard-list">
          {filtered.map((row) => {
            const finished = ["finished", "abandoned"].includes(row.status);
            const livePoints = !finished && row.status !== "draft";
            return (
              <Link
                href={`/m/${row.short_code}`}
                aria-label={t("historyCardAria", {
                  name:
                    row.overlay.tournamentName ||
                    row.tournament_label ||
                    t("historyMatchFallbackName"),
                  teamA: row.teams.a.name,
                  teamB: row.teams.b.name,
                  status: t(STATUS_KEYS[matchStatusId(row)]),
                  code: row.short_code,
                })}
                className="pbw-card pbw-match pbw-scorecard"
                key={row.id}
              >
                <div className="pbw-scorecard-header">
                  <span
                    className={`pbw-match-status${matchStatusId(row) === "live" ? " is-live" : ""}`}
                  >
                    {t(STATUS_KEYS[matchStatusId(row)])}
                  </span>
                  <time dateTime={row.created_at}>
                    {format.dateTime(new Date(row.created_at), {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </time>
                </div>
                <h2>
                  {row.overlay.tournamentName ||
                    row.tournament_label ||
                    t("historyMatchFallbackName")}
                </h2>
                <div className="pbw-history-board">
                  <table aria-label={t("historyTableAria")}>
                    <thead>
                      <tr>
                        <th scope="col">{t("historyColumnPairs")}</th>
                        {row.state.sets.map((_, i) => (
                          <th scope="col" key={i}>
                            {t("historyColumnSet", { number: i + 1 })}
                          </th>
                        ))}
                        {livePoints && (
                          <th scope="col">
                            {row.state.phase.includes("tiebreak")
                              ? t("historyColumnTiebreak")
                              : t("historyColumnPoints")}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {(["a", "b"] as const).map((team) => (
                        <tr
                          key={team}
                          className={
                            row.state.winner === team ? "is-winner" : ""
                          }
                        >
                          <th scope="row">
                            <span className="pbw-history-pair">
                              <span>
                                {row.teams[team].players.some(Boolean)
                                  ? row.teams[team].players
                                      .filter(Boolean)
                                      .join(" / ")
                                  : row.teams[team].name}
                              </span>
                              {row.state.winner === team ? (
                                <Trophy
                                  size={18}
                                  weight="fill"
                                  aria-label={t("historyWinningPairAria")}
                                />
                              ) : !finished &&
                                row.state.servingTeam === team ? (
                                <TennisBall
                                  size={18}
                                  weight="fill"
                                  aria-label={t("historyServingPairAria")}
                                />
                              ) : (
                                <span className="pbw-serve-spacer" />
                              )}
                            </span>
                          </th>
                          {row.state.sets.map((set, i) => (
                            <td key={i}>{set[team]}</td>
                          ))}
                          {livePoints && (
                            <td className="pbw-history-points">
                              {pointLabel(row.state, team)}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="pbw-scorecard-footer">
                  <span>
                    <MatchDuration row={row} /> · {row.short_code}
                  </span>
                  <strong>
                    {finished ? t("historyViewMatch") : t("historyOpenMatch")}
                  </strong>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
