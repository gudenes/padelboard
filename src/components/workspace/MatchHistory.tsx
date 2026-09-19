"use client";
import { useState } from "react";
import Link from "next/link";
import type { MatchRow } from "@/types/match";
import { MatchDuration } from "./MatchDuration";
export function MatchHistory({ rows }: { rows: MatchRow[] }) {
  const [filter, setFilter] = useState<"active" | "history" | "all">("active");
  const filtered = rows.filter(
    (r) =>
      filter === "all" ||
      (filter === "active"
        ? !["finished", "abandoned"].includes(r.status)
        : ["finished", "abandoned"].includes(r.status)),
  );
  return (
    <>
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
      {!filtered.length ? (
        <section className="pbw-card pbw-empty">
          <h2>
            {filter === "history"
              ? "Your next great match belongs here."
              : "Ready for a new match?"}
          </h2>
          <p>
            {filter === "history"
              ? "Finished matches appear here with their final score and duration."
              : "Create a board, add your pairs and get on court."}
          </p>
          <Link className="pbw-primary" href="/dashboard/new">
            Create a board →
          </Link>
        </section>
      ) : (
        <div className="pbw-match-list">
          {filtered.map((row) => (
            <Link
              href={`/m/${row.short_code}`}
              className="pbw-card pbw-match"
              key={row.id}
            >
              <div>
                <span className="pbw-eyebrow">
                  {row.status === "finished"
                    ? "FINISHED"
                    : row.status === "draft"
                      ? "DRAFT"
                      : "ON COURT"}{" "}
                  ·{" "}
                  {new Date(row.created_at).toLocaleDateString("en-GB", {
                    timeZone: "UTC",
                  })}
                </span>
                <h2>{row.overlay.tournamentName || "Padel match"}</h2>
                <p>
                  {row.teams.a.name}
                  <br />
                  {row.teams.b.name}
                </p>
                {row.state.winner && (
                  <strong>{row.teams[row.state.winner].name} won</strong>
                )}
              </div>
              <div className="pbw-match-score">
                <strong>
                  {row.state.sets.map((s) => `${s.a}–${s.b}`).join(" · ")}
                </strong>
                <span>
                  <MatchDuration row={row} />
                </span>
                <span>
                  {row.status === "finished" ? "View match" : "Open controls"} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
