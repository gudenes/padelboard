"use client";
import { useState } from "react";
import { useFormatter, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MagnifyingGlass, TennisBall, Trophy, X } from "@phosphor-icons/react";
import type { MatchRow } from "@/types/match";
import { pointLabel } from "@/lib/scoreboard-labels";
import { matchesSearch, matchStatus, matchStatusId } from "@/lib/match-search";
import { MatchDuration } from "./MatchDuration";
export function MatchHistory({ rows }: { rows: MatchRow[] }) {
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
        <div className="pbw-tabs" aria-label="Match filters">
          {(["active", "history", "all"] as const).map((f) => (
            <button
              key={f}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f === "active"
                ? "On court"
                : f === "history"
                  ? "History"
                  : "All matches"}
            </button>
          ))}
        </div>
        <div className="pbw-match-search" role="search">
          <MagnifyingGlass size={20} aria-hidden="true" />
          <input
            type="search"
            aria-label="Search matches"
            placeholder="Search players, match, date…"
            value={query}
            onChange={(e) => {
              if (!query.trim() && e.target.value.trim()) setFilter("all");
              setQuery(e.target.value);
            }}
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
      <p className="pbw-search-count" role="status">
        {filtered.length} {filtered.length === 1 ? "match" : "matches"}
        {query.trim() ? ` matching “${query.trim()}”` : ""}
      </p>
      {!filtered.length ? (
        <section className="pbw-card pbw-empty">
          <h2>
            {query.trim()
              ? "No matches found."
              : filter === "history"
                ? "Your next great match belongs here."
                : "Ready for a new match?"}
          </h2>
          <p>
            {query.trim()
              ? "Try a player’s name, match title, code, date or status."
              : filter === "history"
                ? "Finished matches appear here with their final score and duration."
                : "Create a board, add your pairs and get on court."}
          </p>
          {query.trim() ? (
            <button
              className="pbw-secondary"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              Clear search & show all
            </button>
          ) : (
            <Link className="pbw-primary" href="/dashboard/new">
              Create a board →
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
                aria-label={`${row.overlay.tournamentName || row.tournament_label || "Padel match"}: ${row.teams.a.name} versus ${row.teams.b.name}. ${matchStatus(row)}. ${row.short_code}.`}
                className="pbw-card pbw-match pbw-scorecard"
                key={row.id}
              >
                <div className="pbw-scorecard-header">
                  <span
                    className={`pbw-match-status${matchStatusId(row) === "live" ? " is-live" : ""}`}
                  >
                    {matchStatus(row)}
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
                    "Padel match"}
                </h2>
                <div className="pbw-history-board">
                  <table aria-label="Match scoreboard">
                    <thead>
                      <tr>
                        <th scope="col">Pairs</th>
                        {row.state.sets.map((_, i) => (
                          <th scope="col" key={i}>
                            S{i + 1}
                          </th>
                        ))}
                        {livePoints && (
                          <th scope="col">
                            {row.state.phase.includes("tiebreak")
                              ? "TB"
                              : "PTS"}
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
                                  aria-label="Winning pair"
                                />
                              ) : !finished &&
                                row.state.servingTeam === team ? (
                                <TennisBall
                                  size={18}
                                  weight="fill"
                                  aria-label="Serving pair"
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
                  <strong>{finished ? "View match" : "Open match"} →</strong>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
