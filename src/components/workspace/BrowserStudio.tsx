"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { MatchRow } from "@/types/match";
import { useMatchState } from "@/hooks/useMatchState";
import { matchClock } from "@/lib/match-clock";
import { stopMedia, cameraError } from "@/lib/studio-media";
import { BoardPreview } from "./BoardPreview";
import { MatchDuration } from "./MatchDuration";
import { AnimatedMatchTime } from "./AnimatedMatchTime";
import { resolveCustomDesign } from "@/lib/custom-board";
import { WorkspaceHeader } from "./WorkspaceHeader";
import "./workspace.css";
export function BrowserStudio({ initial }: { initial: MatchRow }) {
  const live = useMatchState(initial.id, initial),
    [local, setLocal] = useState(initial);
  const row =
    Date.parse(live.updated_at) > Date.parse(local.updated_at) ? live : local;
  const video = useRef<HTMLVideoElement>(null),
    stage = useRef<HTMLDivElement>(null),
    stream = useRef<MediaStream | null>(null),
    request = useRef(0);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]),
    [device, setDevice] = useState(""),
    [ready, setReady] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [clean, setClean] = useState(false),
    [focused, setFocused] = useState(false),
    [busy, setBusy] = useState(false);
  const [mirror, setMirror] = useState(false),
    [position, setPosition] = useState(row.overlay.position),
    [size, setSize] = useState(
      Math.max(20, Math.min(80, 32 * row.overlay.scale)),
    );
  const boardElement = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  const [placement, setPlacement] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [stageHeight, setStageHeight] = useState(720);
  const [boardHeight, setBoardHeight] = useState(100);
  useEffect(() => {
    const measure = () => {
      if (stage.current) setStageHeight(stage.current.clientHeight);
      if (boardElement.current)
        setBoardHeight(boardElement.current.offsetHeight);
    };
    const observer = new ResizeObserver(measure);
    if (stage.current) observer.observe(stage.current);
    if (boardElement.current) observer.observe(boardElement.current);
    measure();
    return () => observer.disconnect();
  }, []);
  async function listCameras() {
    try {
      const list = await navigator.mediaDevices?.enumerateDevices();
      if (list) setDevices(list.filter((d) => d.kind === "videoinput"));
    } catch {
      /* Starting the camera displays any permission error. */
    }
  }
  function stop() {
    request.current++;
    stopMedia(stream.current);
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    setReady(false);
    setLoading(false);
  }
  useEffect(() => {
    void listCameras();
    const media = navigator.mediaDevices;
    const leave = () => {
      request.current++;
      stopMedia(stream.current);
      stream.current = null;
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setClean(false);
    };
    const full = () => {
      if (!document.fullscreenElement) setClean(false);
    };
    media?.addEventListener("devicechange", listCameras);
    window.addEventListener("pagehide", leave);
    window.addEventListener("keydown", esc);
    document.addEventListener("fullscreenchange", full);
    return () => {
      leave();
      media?.removeEventListener("devicechange", listCameras);
      window.removeEventListener("pagehide", leave);
      window.removeEventListener("keydown", esc);
      document.removeEventListener("fullscreenchange", full);
    };
  }, []);
  async function start(selected = device) {
    const version = ++request.current;
    setLoading(true);
    setError("");
    setReady(false);
    stopMedia(stream.current);
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported");
      const next = await navigator.mediaDevices.getUserMedia({
        video: selected
          ? {
              deviceId: { exact: selected },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            }
          : { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      if (version !== request.current) {
        stopMedia(next);
        return;
      }
      stream.current = next;
      const track = next.getVideoTracks()[0];
      setDevice(track.getSettings().deviceId || selected);
      track.addEventListener("ended", () => {
        if (stream.current === next) {
          stopMedia(next);
          stream.current = null;
          setReady(false);
          setClean(false);
          setError("Camera disconnected. Connect it and start again.");
        }
      });
      if (video.current) {
        video.current.srcObject = next;
        await video.current.play();
      }
      if (version !== request.current) {
        stopMedia(next);
        return;
      }
      setReady(true);
      void listCameras();
    } catch (e) {
      if (version === request.current) {
        stopMedia(stream.current);
        stream.current = null;
        setError(cameraError(e));
      }
    } finally {
      if (version === request.current) setLoading(false);
    }
  }
  async function act(action: Record<string, unknown>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/matches/${row.id}/action`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setLocal(data.row);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update score.");
    } finally {
      setBusy(false);
    }
  }
  async function shareView() {
    setClean(true);
    try {
      await stage.current?.requestFullscreen();
    } catch {
      /* Clean tab view also works without the fullscreen API. */
    }
  }
  const [stageWidth, setStageWidth] = useState(1280);
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new ResizeObserver(() =>
      setStageWidth(element.clientWidth),
    );
    setStageWidth(element.clientWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  // Tighten the name area rather than shrinking the entire board vertically.
  const boardWidth = Math.round(
    (row.overlay.template === "custom"
      ? resolveCustomDesign(row.overlay.customDesign).width
      : 460) *
      (32 / 38),
  );
  const boardScale = (stageWidth * size) / 100 / boardWidth;
  const travelX = Math.max(0, stageWidth - boardWidth * boardScale);
  const travelY = Math.max(0, stageHeight - boardHeight * boardScale);
  const clamp = (value: number) => Math.max(0, Math.min(1, value));
  const movable = !clean && row.overlay.showScoreboard !== false;
  const clock = matchClock(row),
    finished = row.status === "finished";
  return (
    <main
      className={`pbw pbw-studio ${focused ? "pbw-studio-focused" : ""} ${clean ? "pbw-studio-clean" : ""}`}
    >
      {!clean && (
        <>
          <WorkspaceHeader
            matchCode={row.short_code}
            matchName={row.overlay.tournamentName}
          />
          <div className="pbw-title">
            <div>
              <span className="pbw-eyebrow">CAMERA. COURT. ACTION.</span>
              <h1>
                {focused
                  ? "You call the points."
                  : "Your browser is the studio."}
              </h1>
              <p>One camera. Your scoreboard. No OBS needed.</p>
            </div>
            <span className="pbw-badge">
              {ready ? "● Camera ready" : "Camera off"}
            </span>
          </div>
        </>
      )}
      <div className="pbw-studio-grid">
        <section>
          <div
            ref={stage}
            className="pbw-camera-stage"
            aria-label="Camera and live scoreboard"
            onDoubleClick={() => {
              if (clean) {
                setClean(false);
                if (document.fullscreenElement)
                  void document.exitFullscreen().catch(() => {});
              }
            }}
          >
            <video
              ref={video}
              muted
              autoPlay
              playsInline
              style={{ transform: mirror ? "scaleX(-1)" : undefined }}
            />
            {!ready && (
              <div className="pbw-camera-empty">
                <span className="pbw-hand">Your court goes here.</span>
                <p>
                  {loading
                    ? "Connecting your camera…"
                    : "Start your camera to see the action."}
                </p>
              </div>
            )}
            <div
              ref={boardElement}
              className={`pbw-camera-board ${placement ? "" : position} ${movable ? "is-draggable" : ""}`}
              tabIndex={movable ? 0 : undefined}
              role={movable ? "group" : undefined}
              aria-label={
                movable
                  ? "Scoreboard position. Drag to move, or use arrow keys."
                  : undefined
              }
              onPointerDown={(e) => {
                if (!movable || e.button !== 0 || !stage.current) return;
                e.preventDefault();
                e.currentTarget.focus();
                const rect = e.currentTarget.getBoundingClientRect();
                const parent = stage.current.getBoundingClientRect();
                drag.current = {
                  x: e.clientX,
                  y: e.clientY,
                  left: rect.left - parent.left - stage.current.clientLeft,
                  top: rect.top - parent.top - stage.current.clientTop,
                };
                setPlacement({
                  x: clamp(drag.current.left / (travelX || 1)),
                  y: clamp(drag.current.top / (travelY || 1)),
                });
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!drag.current) return;
                setPlacement({
                  x: clamp(
                    (drag.current.left + e.clientX - drag.current.x) /
                      (travelX || 1),
                  ),
                  y: clamp(
                    (drag.current.top + e.clientY - drag.current.y) /
                      (travelY || 1),
                  ),
                });
              }}
              onPointerUp={(e) => {
                drag.current = null;
                if (e.currentTarget.hasPointerCapture(e.pointerId))
                  e.currentTarget.releasePointerCapture(e.pointerId);
              }}
              onPointerCancel={() => {
                drag.current = null;
              }}
              onLostPointerCapture={() => {
                drag.current = null;
              }}
              onKeyDown={(e) => {
                if (
                  !movable ||
                  !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                    e.key,
                  )
                )
                  return;
                e.preventDefault();
                const step = e.shiftKey ? 0.05 : 0.01;
                const current = placement || {
                  x: position.endsWith("right") ? 0.97 : 0.03,
                  y: position.startsWith("bottom") ? 0.97 : 0.03,
                };
                setPlacement({
                  x: clamp(
                    current.x +
                      (e.key === "ArrowRight"
                        ? step
                        : e.key === "ArrowLeft"
                          ? -step
                          : 0),
                  ),
                  y: clamp(
                    current.y +
                      (e.key === "ArrowDown"
                        ? step
                        : e.key === "ArrowUp"
                          ? -step
                          : 0),
                  ),
                });
              }}
              style={{
                width: boardWidth,
                maxWidth: "none",
                minWidth: 0,
                transform: `scale(${boardScale})`,
                transformOrigin: placement
                  ? "top left"
                  : position.replace("-", " "),
                ...(placement
                  ? {
                      left: placement.x * travelX,
                      top: placement.y * travelY,
                      right: "auto",
                      bottom: "auto",
                    }
                  : {}),
              }}
            >
              <div
                style={{
                  opacity: row.overlay.showScoreboard === false ? 0 : 1,
                  transition: "opacity 240ms ease",
                }}
              >
                <BoardPreview row={row} />
                <AnimatedMatchTime row={row} />
              </div>
            </div>
          </div>
          {!clean && (
            <section className="pbw-card pbw-studio-scoring">
              <div className="pbw-clock">
                <strong>
                  <MatchDuration row={row} />
                </strong>
                <button
                  className="pbw-secondary"
                  disabled={busy || finished}
                  onClick={() =>
                    void act({
                      kind: clock.runningSince ? "pause_clock" : "start_clock",
                    })
                  }
                >
                  {finished
                    ? "Match finished"
                    : clock.runningSince
                      ? "Pause match"
                      : row.started_at
                        ? "Resume match"
                        : "Start match"}
                </button>
              </div>
              <div className="pbw-points">
                {(["a", "b"] as const).map((team) => (
                  <button
                    key={team}
                    disabled={busy || finished || !clock.runningSince}
                    onClick={() => void act({ kind: "point_for", team })}
                  >
                    <strong>{row.teams[team].name}</strong>
                    <b>+ Point</b>
                  </button>
                ))}
              </div>
              <button
                className="pbw-secondary"
                disabled={busy || !row.overlay.scoreHistory?.length}
                onClick={() => void act({ kind: "undo" })}
              >
                ↶ Undo last point
              </button>
              <a
                className="pbw-text-link"
                href={`/m/${row.short_code}`}
                target="_blank"
                rel="noreferrer"
              >
                Open scoring controls in another tab ↗
              </a>
            </section>
          )}
        </section>
        {!clean && !focused && (
          <aside className="pbw-card pbw-studio-controls">
            <h2>Set the scene.</h2>
            <button className="pbw-primary" onClick={() => setFocused(true)}>
              Setup complete · Focus mode →
            </button>
            <label>
              Camera
              <select
                value={device}
                disabled={loading}
                onChange={(e) => {
                  setDevice(e.target.value);
                  if (ready) void start(e.target.value);
                }}
              >
                <option value="">Default camera</option>
                {devices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="pbw-primary"
              disabled={loading}
              onClick={() => (ready ? stop() : void start())}
            >
              {loading
                ? "Connecting…"
                : ready
                  ? "Turn camera off"
                  : "Start camera →"}
            </button>
            <label className="pbw-toggle">
              <input
                type="checkbox"
                checked={mirror}
                onChange={(e) => setMirror(e.target.checked)}
              />
              Mirror camera
            </label>
            <label>
              Scoreboard position
              <select
                value={placement ? "custom" : position}
                onChange={(e) => {
                  setPlacement(null);
                  setPosition(e.target.value as typeof position);
                }}
              >
                {placement && (
                  <option value="custom" disabled>
                    Custom · dragged position
                  </option>
                )}
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
              <span className="pbw-muted">
                Drag the scoreboard on the preview to place it anywhere. Arrow
                keys fine-tune its position.
              </span>
              Whole scoreboard size · {size}%
              <input
                type="range"
                min="10"
                max="80"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
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
              Show match time
            </label>
            <p className="pbw-muted">
              Hide or show the time on the studio and stream overlay. The match
              clock keeps running.
            </p>
            <Link className="pbw-text-link" href={`/m/${row.short_code}/edit`}>
              Edit scoreboard design ↗
            </Link>
            <hr />
            <h3>Ready to share?</h3>
            <ol className="pbw-share-steps">
              <li>
                Open your streaming service and choose screen / tab sharing.
              </li>
              <li>
                Select this Padelboard tab, then turn on clean view below.
              </li>
              <li>
                Choose your microphone in the streaming service. Update scores
                from the controls in another tab or device.
              </li>
            </ol>
            <button
              className="pbw-primary"
              disabled={!ready}
              onClick={() => void shareView()}
            >
              Clean view to share ↗
            </button>
            <p className="pbw-muted">
              Press Esc or double-tap the video to return to controls. This
              studio prepares your camera and scoreboard; it doesn’t broadcast
              directly to YouTube or other platforms.
            </p>
          </aside>
        )}
      </div>
      {!clean && focused && (
        <section className="pbw-card pbw-focus-tools">
          <button className="pbw-secondary" onClick={() => setFocused(false)}>
            ← Adjust scene
          </button>
          <button
            className="pbw-secondary"
            disabled={busy}
            aria-pressed={row.overlay.showScoreboard !== false}
            onClick={() =>
              void act({
                kind: "show_scoreboard",
                value: row.overlay.showScoreboard === false,
              })
            }
          >
            {row.overlay.showScoreboard === false
              ? "Show scoreboard"
              : "Hide scoreboard"}
          </button>
          <button
            className="pbw-secondary"
            disabled={busy}
            aria-pressed={row.overlay.showTimer}
            onClick={() =>
              void act({ kind: "show_timer", value: !row.overlay.showTimer })
            }
          >
            {row.overlay.showTimer ? "Hide match time" : "Show match time"}
          </button>
          <button
            className="pbw-primary"
            disabled={!ready}
            onClick={() => void shareView()}
          >
            Clean view to share ↗
          </button>
        </section>
      )}
      {!clean && error && (
        <p className="pbw-error" role="alert">
          {error}
        </p>
      )}
    </main>
  );
}
