"use client";
import { useEffect, useRef, useState } from "react";
import type { MatchRow } from "@/types/match";
import { useMatchState } from "@/hooks/useMatchState";
import { matchClock } from "@/lib/match-clock";
import { Operator } from "@/app/m/[code]/Operator";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { BrowserStudio } from "./BrowserStudio";
import { ScoreboardEditor } from "./ScoreboardEditor";
import { MatchAnalytics } from "./MatchAnalytics";
import { BoardPreview } from "./BoardPreview";
import { AnimatedMatchTime } from "./AnimatedMatchTime";
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
      setNotice("Your browser couldn’t remember this choice.");
    }
  }
  function rememberChoice(value: boolean) {
    setRemember(value);
    try {
      if (value && output) localStorage.setItem(preferenceKey, output);
      else localStorage.removeItem(preferenceKey);
    } catch {
      setNotice("Your browser couldn’t remember this choice.");
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
            <span className="pbw-hand">YOUR MATCH. YOUR CALL.</span>
            <h1>{row.overlay.tournamentName || "Let’s play some padel."}</h1>
          </div>
          <span className="pbw-badge">
            {row.status === "finished"
              ? "Match finished"
              : clock.runningSince
                ? "● On court"
                : row.started_at
                  ? "Paused"
                  : "Ready to play"}
          </span>
        </div>
        <div className="pbw-workspace-toolbar">
          <div
            className="pbw-workspace-tabs"
            role="tablist"
            aria-label="Match workspace"
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
                {value === "live" ? "Live" : "Insights"}
              </button>
            ))}
          </div>
          <div className="pbw-workspace-actions">
            {(tab === "live" || focused) && output && (
              <button
                className="pbw-secondary"
                aria-pressed={focused}
                onClick={() => setFocused(!focused)}
              >
                {focused ? "Exit focus" : "Focus mode"}
              </button>
            )}
            <button
              className="pbw-secondary pbw-edit-launch"
              onClick={() => setEditing(true)}
            >
              Edit board
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
            aria-label="Broadcast output"
          >
            <span className="pbw-eyebrow">OUTPUT</span>
            <div className="pbw-output-switch">
              <span className={output === "studio" ? "is-active" : ""}>
                Padelboard Studio
              </span>
              <button
                type="button"
                role="switch"
                aria-label="Use OBS overlay"
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
              Remember my choice on this browser
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
                aria-label="OBS scoreboard preview"
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
                    ? "Scoreboard hidden on stream"
                    : "Live overlay preview"}
                </span>
              </section>
              {!focused && (
                <section className="pbw-card pbw-obs-connect">
                  <span className="pbw-hand">OBS? YOU’RE ALL SET.</span>
                  <p>
                    Add a Browser Source in OBS, paste this link and set it to
                    1920 × 1080. The background is transparent.
                  </p>
                  <label>
                    Overlay URL
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
                          setNotice("Select and copy the overlay URL.");
                        }
                      }}
                    >
                      {copied ? "✓ Link copied" : "Copy overlay link"}
                    </button>
                    <a
                      className="pbw-secondary"
                      href={`/overlay/${row.short_code}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open clean overlay ↗
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
            <span className="pbw-hand">THAT’S A MATCH.</span>
            <h2>
              {row.state.winner
                ? `${row.teams[row.state.winner].name} win.`
                : "Your result is saved."}
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
          aria-label="Edit scoreboard"
          onCancel={(e) => {
            e.preventDefault();
            closeEditor();
          }}
          onClick={(e) => {
            if (e.target === dialog.current) closeEditor();
          }}
        >
          <div className="pbw-drawer-heading">
            <strong>Edit scoreboard</strong>
            <button
              className="pbw-secondary"
              aria-label="Close scoreboard editor"
              onClick={() => closeEditor()}
            >
              Close ×
            </button>
          </div>
          {discard && (
            <div className="pbw-confirm" role="alert">
              <h3>Keep your changes?</h3>
              <p>
                You have an unsaved design. Continue editing or discard it to
                close.
              </p>
              <button className="pbw-primary" onClick={() => setDiscard(false)}>
                Keep editing
              </button>
              <button
                className="pbw-secondary"
                onClick={() => closeEditor(true)}
              >
                Discard changes
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
