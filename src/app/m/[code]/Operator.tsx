"use client";
import { AddToScreen } from "@/components/workspace/AddToScreen";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { useState } from "react";
import Link from "next/link";
import type { MatchRow } from "@/types/match";
import { useMatchState } from "@/hooks/useMatchState";
import { matchClock } from "@/lib/match-clock";
import { BoardPreview } from "@/components/workspace/BoardPreview";
import { MatchDuration } from "@/components/workspace/MatchDuration";
import "@/components/workspace/workspace.css";
export function Operator({ initial }: { initial: MatchRow }) {
  const remote = useMatchState(initial.id, initial),
    [local, setLocal] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [settings, setSettings] = useState(false),
    [confirmation, setConfirmation] = useState<"finish_match" | "reset" | null>(
      null,
    );
  const row =
    Date.parse(remote.updated_at) > Date.parse(local.updated_at)
      ? remote
      : local;
  const clock = matchClock(row),
    finished = row.status === "finished";
  async function act(action: Record<string, unknown>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/matches/${row.id}/action`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error);
      setLocal(json.row);
      setConfirmation(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="pbw">
      <WorkspaceHeader
        matchCode={row.short_code}
        matchName={row.overlay.tournamentName}
      />
      <div className="pbw-title">
        <div>
          <span className="pbw-eyebrow">OPERATOR MODE · {row.short_code}</span>
          <h1>{row.overlay.tournamentName || "Let’s play some padel."}</h1>
        </div>
        <span className="pbw-badge">
          {finished
            ? "Match finished"
            : clock.runningSince
              ? "● On court"
              : row.started_at
                ? "Paused"
                : "Ready to play"}
        </span>
      </div>
      <div className="pbw-operator">
        <section className="pbw-card">
          <div className="pbw-score-preview">
            <BoardPreview row={row} />
          </div>
          <div className="pbw-clock">
            <div>
              <span className="pbw-eyebrow">MATCH DURATION</span>
              <strong>
                <MatchDuration row={row} />
              </strong>
            </div>
            {!finished && (
              <button
                className="pbw-secondary"
                disabled={busy}
                onClick={() =>
                  void act({
                    kind: clock.runningSince ? "pause_clock" : "start_clock",
                  })
                }
              >
                {clock.runningSince
                  ? "Pause"
                  : row.started_at
                    ? "Resume match"
                    : "Start match →"}
              </button>
            )}
          </div>
          <fieldset className="pbw-servers" disabled={busy || finished}>
            <legend>Who’s serving?</legend>
            <div className="pbw-server-pairs">
              {(["a", "b"] as const).map((team) => (
                <div key={team}>
                  <span className="pbw-muted">
                    Pair {team === "a" ? "one" : "two"}
                  </span>
                  {([0, 1] as const).map((player) => (
                    <button
                      type="button"
                      key={player}
                      aria-pressed={
                        row.state.servingTeam === team &&
                        Math.floor(row.state.servingPlayer / 2) === player
                      }
                      onClick={() =>
                        void act({ kind: "set_server", team, player })
                      }
                    >
                      {row.state.servingTeam === team &&
                      Math.floor(row.state.servingPlayer / 2) === player
                        ? "● "
                        : ""}
                      {row.teams[team].players[player] ||
                        `Player ${player + 1}`}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <p className="pbw-muted">
              Choose the server before play, or correct it here. We rotate
              automatically after games and during tiebreaks.
            </p>
          </fieldset>
          <div className="pbw-points">
            {(["a", "b"] as const).map((team) => (
              <button
                key={team}
                disabled={busy || finished || !clock.runningSince}
                onClick={() => void act({ kind: "point_for", team })}
              >
                <span>
                  {row.state.servingTeam === team
                    ? `● ${row.teams[team].players[Math.floor(row.state.servingPlayer / 2)] || "Player " + (Math.floor(row.state.servingPlayer / 2) + 1)} serving`
                    : "Receiving"}
                </span>
                <strong>{row.teams[team].name}</strong>
                <b>+ Point</b>
              </button>
            ))}
          </div>
          {!row.started_at && !finished && (
            <p className="pbw-muted">
              Start the match when the first serve is ready. Your clock and
              scoring controls start together.
            </p>
          )}
          <button
            className="pbw-secondary"
            disabled={busy || !row.overlay.scoreHistory?.length}
            onClick={() => void act({ kind: "undo" })}
          >
            ↶ Undo last point
          </button>
          {busy && (
            <span className="pbw-muted" role="status">
              {" "}
              Saving…
            </span>
          )}
          {error && (
            <p role="alert" className="pbw-error">
              {error}
            </p>
          )}
          {finished && (
            <p className="pbw-result">
              {row.state.winner
                ? `${row.teams[row.state.winner].name} win the match.`
                : "Match saved to your history."}
            </p>
          )}
        </section>
        <aside>
          <AddToScreen row={row} />
          <section className="pbw-card">
            <Link className="pbw-secondary" href={`/m/${row.short_code}/edit`}>
              Edit scoreboard design ↗
            </Link>
            <label className="pbw-toggle">
              <input
                type="checkbox"
                checked={row.overlay.showScoreboard !== false}
                disabled={busy}
                onChange={(e) =>
                  void act({ kind: "show_scoreboard", value: e.target.checked })
                }
              />
              Show scoreboard on screen
            </label>
            <label className="pbw-toggle">
              <input
                type="checkbox"
                checked={row.overlay.showTimer}
                disabled={busy}
                onChange={(e) =>
                  void act({ kind: "show_timer", value: e.target.checked })
                }
              />
              Show match time on screen
            </label>
          </section>
          <section className="pbw-card pbw-match-tools">
            <button
              className="pbw-secondary"
              aria-expanded={settings}
              onClick={() => setSettings(!settings)}
            >
              Match options {settings ? "−" : "+"}
            </button>
            {confirmation && (
              <div className="pbw-confirm" role="alert" aria-live="assertive">
                <h3>
                  {confirmation === "reset"
                    ? "Start fresh?"
                    : "Call it a match?"}
                </h3>
                <p>
                  {confirmation === "reset"
                    ? "This clears the score, clock and undo history. Your players, design and rules stay the same."
                    : "Your current score will be saved to match history and the clock will stop."}
                </p>
                <button
                  className="pbw-primary"
                  disabled={busy}
                  onClick={() => void act({ kind: confirmation })}
                >
                  {busy
                    ? "Saving…"
                    : confirmation === "reset"
                      ? "Yes, reset score & clock"
                      : "Yes, end match"}
                </button>
                <button
                  className="pbw-secondary"
                  disabled={busy}
                  onClick={() => setConfirmation(null)}
                >
                  Cancel
                </button>
              </div>
            )}
            {settings && !confirmation && (
              <>
                <p>
                  Finish this match or start fresh with the same players and
                  board.
                </p>
                {!finished && (
                  <button
                    className="pbw-secondary"
                    disabled={busy}
                    onClick={() => setConfirmation("finish_match")}
                  >
                    End match
                  </button>
                )}
                <button
                  className="pbw-secondary"
                  disabled={busy}
                  onClick={() => setConfirmation("reset")}
                >
                  Reset score & clock
                </button>
              </>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
