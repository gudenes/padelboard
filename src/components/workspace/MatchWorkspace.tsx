"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { MatchRow } from "@/types/match";
import { useMatchState } from "@/hooks/useMatchState";
import { matchClock } from "@/lib/match-clock";
import { Operator } from "@/app/[locale]/m/[code]/Operator";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { BrowserStudio } from "./BrowserStudio";
import { ScoreboardEditor } from "./ScoreboardEditor";
import { MatchAnalytics } from "./MatchAnalytics";
import { BoardPreview } from "./BoardPreview";
import { AnimatedMatchTime } from "./AnimatedMatchTime";
import { BroadcastGuide } from "./BroadcastGuide";
import { PhoneControl } from "./PhoneControl";
import "./workspace.css";

type Output = "studio" | "obs";
export function MatchWorkspace({
  initial,
  initialOutput,
  initialView,
}: {
  initial: MatchRow;
  initialOutput?: Output;
  initialView?: string;
}) {
  const t = useTranslations("workspace");
  const remote = useMatchState(initial.id, initial);
  const [local, setLocal] = useState(initial);
  const row =
    Date.parse(remote.updated_at) > Date.parse(local.updated_at)
      ? remote
      : local;
  const [output, setOutput] = useState<Output>(initialOutput ?? "studio");
  const [remember, setRemember] = useState(false);
  const [tab, setTab] = useState(
    initialView === "insights" ||
      (!initialView && !initialOutput && initial.status === "finished")
      ? "insights"
      : "live",
  );
  const [focused, setFocused] = useState(false);
  const [clean, setClean] = useState(false);
  const [editing, setEditing] = useState(initialView === "edit");
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const [overlayUrl, setOverlayUrl] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const previousStatus = useRef(initial.status);
  const preferenceKey = `padelboard:screen-destination:${initial.owner_id}`;
  useEffect(() => {
    setOverlayUrl(`${location.origin}/overlay/${initial.short_code}`);
    try {
      const saved = localStorage.getItem(preferenceKey);
      if (saved === "studio" || saved === "obs") {
        setRemember(true);
        if (!initialOutput) setOutput(saved);
      }
    } catch {
      /* Output selection still works without local storage. */
    }
  }, [initial.short_code, initialOutput, preferenceKey]);
  useEffect(() => {
    if (clean) return;
    if (
      row.status === "finished" &&
      previousStatus.current !== "finished" &&
      !clean
    ) {
      setTab("insights");
      setFocused(false);
    }
    previousStatus.current = row.status;
  }, [row.status, clean]);
  useEffect(() => {
    if (editing) dialog.current?.showModal();
  }, [editing]);
  useEffect(() => {
    const url = new URL(location.href);
    url.searchParams.set("view", editing ? "edit" : tab);
    if (output) url.searchParams.set("output", output);
    else url.searchParams.delete("output");
    history.replaceState(history.state, "", `${url.pathname}${url.search}`);
  }, [output, tab, editing]);
  function choose(value: Output) {
    setOutput(value);
    setNotice("");
    try {
      if (remember) localStorage.setItem(preferenceKey, value);
      else localStorage.removeItem(preferenceKey);
    } catch {
      setNotice(t("matchStorageNotice"));
    }
  }
  function rememberChoice(value: boolean) {
    setRemember(value);
    try {
      if (value && output) localStorage.setItem(preferenceKey, output);
      else localStorage.removeItem(preferenceKey);
    } catch {
      setNotice(t("matchStorageNotice"));
    }
  }
  function closeEditor(force = false) {
    if (dirty && !force) {
      setDiscard(true);
      return;
    }
    dialog.current?.close();
    setEditing(false);
    setDirty(false);
    setDiscard(false);
  }
  const clock = matchClock(row);
  return (
    <main
      className={`pbw pbw-match-workspace${focused ? " is-focused" : ""}${clean ? " is-clean" : ""}`}
    >
      <div className="pbw-workspace-chrome">
        <WorkspaceHeader
          matchCode={row.short_code}
          matchName={row.overlay.tournamentName}
          unified
        />
        <div className="pbw-workspace-heading">
          <div>
            <span className="pbw-hand">{t("matchHand")}</span>
            <h1>{row.overlay.tournamentName || t("matchTitleFallback")}</h1>
          </div>
          <span className="pbw-badge">
            {row.status === "finished"
              ? t("matchBadgeFinished")
              : clock.runningSince
                ? t("matchBadgeLive")
                : row.started_at
                  ? t("matchBadgePaused")
                  : t("matchBadgeReady")}
          </span>
        </div>
        <div className="pbw-workspace-toolbar">
          <div
            className="pbw-workspace-tabs"
            role="tablist"
            aria-label={t("matchTablistAria")}
          >
            {(["live", "insights"] as const).map((value) => (
              <button
                key={value}
                id={`tab-${value}`}
                role="tab"
                aria-selected={tab === value}
                aria-controls={`panel-${value}`}
                tabIndex={tab === value ? 0 : -1}
                onClick={() => setTab(value)}
                onKeyDown={(e) => {
                  if (
                    ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                  ) {
                    e.preventDefault();
                    const next =
                      e.key === "Home"
                        ? "live"
                        : e.key === "End"
                          ? "insights"
                          : value === "live"
                            ? "insights"
                            : "live";
                    setTab(next);
                    document.getElementById(`tab-${next}`)?.focus();
                  }
                }}
              >
                {value === "live" ? t("matchTabLive") : t("matchTabInsights")}
              </button>
            ))}
          </div>
          <div className="pbw-workspace-actions">
            {!focused && !clean && (
              <BroadcastGuide
                code={row.short_code}
                owner={row.owner_id}
                output={output}
                onOutput={choose}
              />
            )}
            {(tab === "live" || focused) && output && (
              <button
                className="pbw-secondary"
                aria-pressed={focused}
                onClick={() => setFocused(!focused)}
              >
                {focused ? t("matchExitFocus") : t("matchFocusMode")}
              </button>
            )}
            <button
              className="pbw-secondary pbw-edit-launch"
              onClick={() => setEditing(true)}
            >
              {t("matchEditBoard")}
            </button>
            <PhoneControl code={row.short_code} />
          </div>
        </div>
      </div>
      <section
        id="panel-live"
        role="tabpanel"
        aria-labelledby="tab-live"
        hidden={tab !== "live"}
      >
        {!focused && (
          <section
            className="pbw-output-picker is-chosen"
            aria-label={t("matchOutputAria")}
          >
            <span className="pbw-eyebrow">{t("matchOutputEyebrow")}</span>
            <div className="pbw-output-switch">
              <span className={output === "studio" ? "is-active" : ""}>
                {t("matchOutputStudio")}
              </span>
              <button
                type="button"
                role="switch"
                aria-label={t("matchOutputObsAria")}
                aria-checked={output === "obs"}
                onClick={() => choose(output === "studio" ? "obs" : "studio")}
              >
                <span />
              </button>
              <span className={output === "obs" ? "is-active" : ""}>OBS</span>
            </div>
            <label className="pbw-toggle">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => rememberChoice(e.target.checked)}
              />
              {t("matchRememberChoice")}
            </label>
            {notice && <p role="status">{notice}</p>}
          </section>
        )}
        <div className="pbw-live-grid">
          <div className="pbw-live-stage">
            {/* Keep Studio mounted while switching outputs or tabs so media survives. */}
            <div hidden={output !== "studio"}>
              <BrowserStudio
                initial={row}
                embedded
                focus={focused}
                active={output === "studio"}
                onCleanChange={setClean}
              />
            </div>
            <div hidden={output !== "obs"} className="pbw-obs-output">
              <section
                className="pbw-obs-stage"
                aria-label={t("matchObsStageAria")}
              >
                <div
                  style={{
                    opacity: row.overlay.showScoreboard === false ? 0.25 : 1,
                    transition: "opacity 240ms ease",
                  }}
                >
                  <BoardPreview row={row} />
                  <AnimatedMatchTime row={row} />
                </div>
                <span>
                  {row.overlay.showScoreboard === false
                    ? t("matchScoreboardHidden")
                    : t("matchOverlayPreview")}
                </span>
              </section>
              {!focused && (
                <section className="pbw-card pbw-obs-connect">
                  <span className="pbw-hand">{t("matchObsHand")}</span>
                  <p>{t("matchObsBody")}</p>
                  <label>
                    {t("matchOverlayUrlLabel")}
                    <input
                      readOnly
                      value={overlayUrl}
                      onFocus={(e) => e.target.select()}
                    />
                  </label>
                  <div className="pbw-obs-actions">
                    <button
                      className="pbw-primary"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(overlayUrl);
                          setCopied(true);
                        } catch {
                          setNotice(t("matchCopyError"));
                        }
                      }}
                    >
                      {copied ? t("matchCopied") : t("matchCopyLink")}
                    </button>
                    <a
                      className="pbw-secondary"
                      href={`/overlay/${row.short_code}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("matchOpenOverlay")}
                    </a>
                  </div>
                </section>
              )}
            </div>
          </div>
          <div className="pbw-live-controls">
            <Operator initial={row} embedded onChange={setLocal} />
          </div>
        </div>
      </section>
      <section
        id="panel-insights"
        role="tabpanel"
        aria-labelledby="tab-insights"
        hidden={tab !== "insights"}
      >
        {row.status === "finished" && (
          <div className="pbw-finished-summary">
            <span className="pbw-hand">{t("matchFinishedHand")}</span>
            <h2>
              {row.state.winner
                ? t("matchWinner", {
                    team: row.teams[row.state.winner].name,
                  })
                : t("matchResultSaved")}
            </h2>
            <BoardPreview row={row} />
          </div>
        )}
        <MatchAnalytics row={row} />
      </section>
      {editing && (
        <dialog
          ref={dialog}
          className="pbw pbw-editor-drawer"
          aria-label={t("matchEditorAria")}
          onCancel={(e) => {
            e.preventDefault();
            closeEditor();
          }}
          onClick={(e) => {
            if (e.target === dialog.current) closeEditor();
          }}
        >
          <div className="pbw-drawer-heading">
            <strong>{t("matchEditorTitle")}</strong>
            <button
              className="pbw-secondary"
              aria-label={t("matchEditorCloseAria")}
              onClick={() => closeEditor()}
            >
              {t("matchEditorClose")}
            </button>
          </div>
          {discard && (
            <div className="pbw-confirm" role="alert">
              <h3>{t("matchDiscardTitle")}</h3>
              <p>{t("matchDiscardBody")}</p>
              <button className="pbw-primary" onClick={() => setDiscard(false)}>
                {t("matchKeepEditing")}
              </button>
              <button
                className="pbw-secondary"
                onClick={() => closeEditor(true)}
              >
                {t("matchDiscard")}
              </button>
            </div>
          )}
          <ScoreboardEditor
            initial={row}
            embedded
            onSaved={setLocal}
            onDirtyChange={setDirty}
          />
        </dialog>
      )}
    </main>
  );
}
