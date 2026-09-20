"use client";
import { useState } from "react";
import Link from "next/link";
import type { MatchRow } from "@/types/match";
import { editableTemplate } from "@/lib/template-design";
import { BOARD_STYLES } from "@/lib/board-styles";
import { resolveCustomDesign } from "@/lib/custom-board";
import { useMatchState } from "@/hooks/useMatchState";
import { CustomBoardEditor } from "@/components/scoreboard/CustomBoardEditor";
import { BoardPreview } from "./BoardPreview";
import { WorkspaceHeader } from "./WorkspaceHeader";
import "./workspace.css";
export function ScoreboardEditor({
  initial,
  embedded = false,
  onSaved,
  onDirtyChange,
}: {
  initial: MatchRow;
  embedded?: boolean;
  onSaved?: (row: MatchRow) => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const remote = useMatchState(initial.id, initial, !embedded);
  const live = embedded ? initial : remote;
  const [overlay, setOverlay] = useState(initial.overlay),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [dirty, setDirty] = useState(false);
  function change(patch: Partial<typeof overlay>) {
    setOverlay((o) => ({ ...o, ...patch }));
    setDirty(true);
    onDirtyChange?.(true);
    setMessage("");
  }
  const accent = overlay.customColors?.accent?.color || "#f5ff36";
  async function save() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/matches/${initial.id}/design`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          template: overlay.template,
          accent,
          tournamentName: overlay.tournamentName || "",
          customDesign: overlay.customDesign,
          position: overlay.position,
          scale: overlay.scale,
          showTimer: overlay.showTimer,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setOverlay(data.row.overlay);
      setDirty(false);
      onDirtyChange?.(false);
      onSaved?.(data.row);
      setMessage("Saved! Your overlay and studio now use this design.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }
  const Root = embedded ? "div" : "main";
  return (
    <Root className={embedded ? "pbw-embedded-editor" : "pbw"}>
      {!embedded && (
        <WorkspaceHeader
          matchCode={initial.short_code}
          matchName={initial.overlay.tournamentName}
        />
      )}
      <div className="pbw-title">
        <div>
          <span className="pbw-eyebrow">SAME MATCH. FRESH LOOK.</span>
          <h1>Make it yours. Again.</h1>
          <p>Edit the look, keep every point. Changes go live when you save.</p>
        </div>
      </div>
      <div className="pbw-edit-grid">
        <section className="pbw-card">
          <fieldset disabled={busy} className="pbw-edit-fields">
            <label>
              Board style
              <select
                value={overlay.template}
                onChange={(e) =>
                  change({
                    template: e.target.value as typeof overlay.template,
                  })
                }
              >
                {!BOARD_STYLES.some((s) => s.id === overlay.template) && (
                  <option value={overlay.template} disabled>
                    Choose a current template
                  </option>
                )}
                {BOARD_STYLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Match title
              <input
                maxLength={100}
                value={overlay.tournamentName || ""}
                onChange={(e) => change({ tournamentName: e.target.value })}
              />
            </label>
            <label>
              Accent color
              <input
                type="color"
                value={accent}
                onChange={(e) =>
                  change({
                    customColors: {
                      ...overlay.customColors,
                      accent: { color: e.target.value },
                    },
                  })
                }
              />
            </label>
            {overlay.template !== "custom" && (
              <button
                type="button"
                className="pbw-secondary"
                onClick={() =>
                  change({
                    template: "custom",
                    customDesign: editableTemplate(
                      BOARD_STYLES.find((s) => s.id === overlay.template)?.id ||
                        "padelboard",
                      accent,
                    ),
                  })
                }
              >
                Fine-tune this template →
              </button>
            )}
            {overlay.template === "custom" && (
              <CustomBoardEditor
                design={resolveCustomDesign(overlay.customDesign)}
                accent={accent}
                onChange={(customDesign) => change({ customDesign })}
                onAccentChange={(color) =>
                  change({
                    customColors: {
                      ...overlay.customColors,
                      accent: { color },
                    },
                  })
                }
              />
            )}
            <label>
              Stream position
              <select
                value={overlay.position}
                onChange={(e) =>
                  change({
                    position: e.target.value as typeof overlay.position,
                  })
                }
              >
                {["top-left", "top-right", "bottom-left", "bottom-right"].map(
                  (p) => (
                    <option key={p} value={p}>
                      {p.replace("-", " ")}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label>
              Stream size · {Math.round(overlay.scale * 100)}%
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={overlay.scale}
                onChange={(e) => change({ scale: Number(e.target.value) })}
              />
            </label>
            <label className="pbw-toggle">
              <input
                type="checkbox"
                checked={overlay.showTimer}
                onChange={(e) => change({ showTimer: e.target.checked })}
              />
              Show match duration
            </label>
          </fieldset>
          <button
            className="pbw-primary"
            disabled={busy || !dirty}
            onClick={() => void save()}
          >
            {busy ? "Saving your look…" : "Save scoreboard →"}
          </button>
          {message && <p role="status">{message}</p>}
          {error && (
            <p className="pbw-error" role="alert">
              {error}
            </p>
          )}
          {dirty && (
            <p className="pbw-muted">
              Unsaved changes. Save before leaving this page.
            </p>
          )}
        </section>
        <aside className="pbw-edit-preview">
          <span className="pbw-hand">A fresh look. Same match energy.</span>
          <BoardPreview row={{ ...live, overlay }} />
          <p>Live score · design preview</p>
        </aside>
      </div>
    </Root>
  );
}
