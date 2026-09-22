"use client";
import { AddToScreen } from "@/components/workspace/AddToScreen";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { MatchRow } from "@/types/match";
import { useMatchState } from "@/hooks/useMatchState";
import { useApiErrorMessage } from "@/hooks/useApiError";
import { matchClock } from "@/lib/match-clock";
import { BoardPreview } from "@/components/workspace/BoardPreview";
import { MatchDuration } from "@/components/workspace/MatchDuration";
import "@/components/workspace/workspace.css";
export function Operator({
  initial,
  phone = false,
  embedded = false,
  onChange,
}: {
  initial: MatchRow;
  phone?: boolean;
  embedded?: boolean;
  onChange?: (row: MatchRow) => void;
}) {
  const t = useTranslations("operator");
  const errorMessage = useApiErrorMessage();
  const remote = useMatchState(initial.id, initial, !embedded),
    [local, setLocal] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [settings, setSettings] = useState(false),
    [confirmation, setConfirmation] = useState<"finish_match" | "reset" | null>(
      null,
    );
  const row = embedded
    ? initial
    : Date.parse(remote.updated_at) > Date.parse(local.updated_at)
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
      onChange?.(json.row);
      setConfirmation(null);
    } catch (e) {
      setError(errorMessage(e instanceof Error ? e.message : undefined));
    } finally {
      setBusy(false);
    }
  }
  const Root = embedded ? "div" : "main";
  return (
    <Root
      className={
        embedded ? "pbw-embedded-operator" : `pbw${phone ? " pbw-remote" : ""}`
      }
    >
      {!embedded && (
        <>
          {phone ? (
            <header className="pbw-remote-brand">
              <strong>padelboard</strong>
              <span>{t("remoteEyebrow", { code: row.short_code })}</span>
            </header>
          ) : (
            <WorkspaceHeader
              matchCode={row.short_code}
              matchName={row.overlay.tournamentName}
            />
          )}
          <div className="pbw-title">
            <div>
              <span className="pbw-eyebrow">
                {phone
                  ? t("eyebrowPhone")
                  : t("eyebrow", { code: row.short_code })}
              </span>
              <h1>{row.overlay.tournamentName || t("titleFallback")}</h1>
            </div>
            <span className="pbw-badge">
              {finished
                ? t("badgeFinished")
                : clock.runningSince
                  ? t("badgeLive")
                  : row.started_at
                    ? t("badgePaused")
                    : t("badgeReady")}
            </span>
          </div>
        </>
      )}
      <div className="pbw-operator">
        <section className="pbw-card">
          {!embedded && (
            <div className="pbw-score-preview">
              <BoardPreview row={row} />
            </div>
          )}
          <div className="pbw-clock">
            <div>
              <span className="pbw-eyebrow">{t("clockEyebrow")}</span>
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
                  ? t("clockPause")
                  : row.started_at
                    ? t("clockResume")
                    : t("clockStart")}
              </button>
            )}
          </div>
          <details
            className="pbw-serving-disclosure"
            open={phone || embedded ? undefined : true}
          >
            <summary>{t("servingSummary")}</summary>
            <fieldset className="pbw-servers" disabled={busy || finished}>
              <legend>{t("servingLegend")}</legend>
              <div className="pbw-server-pairs">
                {(["a", "b"] as const).map((team) => (
                  <div key={team}>
                    <span className="pbw-muted">
                      {team === "a" ? t("servingPairOne") : t("servingPairTwo")}
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
                          t("playerFallback", { number: player + 1 })}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              <p className="pbw-muted">{t("servingHint")}</p>
            </fieldset>
          </details>
          <div className="pbw-points">
            {(["a", "b"] as const).map((team) => (
              <button
                key={team}
                disabled={busy || finished || !clock.runningSince}
                onClick={() => void act({ kind: "point_for", team })}
              >
                <span>
                  {row.state.servingTeam === team
                    ? t("pointServing", {
                        name:
                          row.teams[team].players[
                            Math.floor(row.state.servingPlayer / 2)
                          ] ||
                          t("playerFallback", {
                            number: Math.floor(row.state.servingPlayer / 2) + 1,
                          }),
                      })
                    : t("pointReceiving")}
                </span>
                <strong>{row.teams[team].name}</strong>
                <b>{t("pointAdd")}</b>
              </button>
            ))}
          </div>
          {!row.started_at && !finished && (
            <p className="pbw-muted">
              {phone ? t("startHintPhone") : t("startHint")}
            </p>
          )}
          <button
            className="pbw-secondary"
            disabled={busy || !row.overlay.scoreHistory?.length}
            onClick={() => void act({ kind: "undo" })}
          >
            {t("undo")}
          </button>
          {busy && (
            <span className="pbw-muted" role="status">
              {" "}
              {t("saving")}
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
                ? t("resultWinner", { team: row.teams[row.state.winner].name })
                : t("resultSaved")}
            </p>
          )}
        </section>
        <aside>
          {!phone && !embedded && <AddToScreen row={row} />}
          <section className="pbw-card">
            {!phone && !embedded && (
              <Link
                className="pbw-secondary"
                href={`/m/${row.short_code}/edit`}
              >
                {t("editDesign")}
              </Link>
            )}
            <label className="pbw-toggle">
              <input
                type="checkbox"
                checked={row.overlay.showScoreboard !== false}
                disabled={busy}
                onChange={(e) =>
                  void act({ kind: "show_scoreboard", value: e.target.checked })
                }
              />
              {t("toggleScoreboard")}
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
              {t("toggleTimer")}
            </label>
          </section>
          <section className="pbw-card pbw-match-tools">
            <button
              className="pbw-secondary"
              aria-expanded={settings}
              onClick={() => setSettings(!settings)}
            >
              {phone ? t("optionsPhone") : t("options")} {settings ? "−" : "+"}
            </button>
            {confirmation && (
              <div className="pbw-confirm" role="alert" aria-live="assertive">
                <h3>
                  {confirmation === "reset"
                    ? t("confirmResetTitle")
                    : t("confirmFinishTitle")}
                </h3>
                <p>
                  {confirmation === "reset"
                    ? t("confirmResetBody")
                    : t("confirmFinishBody")}
                </p>
                <button
                  className="pbw-primary"
                  disabled={busy}
                  onClick={() => void act({ kind: confirmation })}
                >
                  {busy
                    ? t("saving")
                    : confirmation === "reset"
                      ? t("confirmReset")
                      : t("confirmFinish")}
                </button>
                <button
                  className="pbw-secondary"
                  disabled={busy}
                  onClick={() => setConfirmation(null)}
                >
                  {t("confirmCancel")}
                </button>
              </div>
            )}
            {settings && !confirmation && (
              <>
                <p>{phone ? t("optionsBodyPhone") : t("optionsBody")}</p>
                {!finished && (
                  <button
                    className="pbw-secondary"
                    disabled={busy}
                    onClick={() => setConfirmation("finish_match")}
                  >
                    {t("endMatch")}
                  </button>
                )}
                {!phone && (
                  <button
                    className="pbw-secondary"
                    disabled={busy}
                    onClick={() => setConfirmation("reset")}
                  >
                    {t("resetMatch")}
                  </button>
                )}
              </>
            )}
          </section>
        </aside>
      </div>
    </Root>
  );
}
