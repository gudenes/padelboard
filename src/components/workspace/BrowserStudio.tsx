"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { MatchRow } from "@/types/match";
import { useMatchState } from "@/hooks/useMatchState";
import { useApiErrorMessage } from "@/hooks/useApiError";
import { matchClock } from "@/lib/match-clock";
import {
  stopMedia,
  cameraError,
  screenError,
  captureStudioSource,
} from "@/lib/studio-media";
import { BoardPreview } from "./BoardPreview";
import { MatchDuration } from "./MatchDuration";
import { AnimatedMatchTime } from "./AnimatedMatchTime";
import { boardLayoutWidth } from "@/lib/custom-board";
import { WorkspaceHeader } from "./WorkspaceHeader";
import "./workspace.css";
export function BrowserStudio({
  initial,
  embedded = false,
  focus = false,
  active = true,
  onCleanChange,
}: {
  initial: MatchRow;
  embedded?: boolean;
  focus?: boolean;
  active?: boolean;
  onCleanChange?: (clean: boolean) => void;
}) {
  const live = useMatchState(initial.id, initial, !embedded),
    [local, setLocal] = useState(initial);
  const row = embedded
    ? initial
    : Date.parse(live.updated_at) > Date.parse(local.updated_at)
      ? live
      : local;
  const video = useRef<HTMLVideoElement>(null),
    stage = useRef<HTMLDivElement>(null),
    stream = useRef<MediaStream | null>(null),
    request = useRef(0);
  const t = useTranslations("studio");
  const tWorkspace = useTranslations("workspace");
  const errorMessage = useApiErrorMessage();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]),
    [device, setDevice] = useState(""),
    [ready, setReady] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [clean, setClean] = useState(false),
    [ownFocused, setFocused] = useState(false),
    [busy, setBusy] = useState(false);
  const [source, setSource] = useState<"camera" | "screen">("camera");
  const [sourceName, setSourceName] = useState("");
  const focused = embedded ? focus : ownFocused;
  useEffect(() => {
    onCleanChange?.(clean);
  }, [clean, onCleanChange]);
  const [mirror, setMirror] = useState(false),
    [position, setPosition] = useState(row.overlay.position),
    [size, setSize] = useState(
      Math.max(20, Math.min(80, 30 * row.overlay.scale)),
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
  useEffect(() => {
    setPosition(row.overlay.position);
    setPlacement(null);
  }, [row.overlay.position]);
  useEffect(() => {
    setSize(Math.max(20, Math.min(80, 30 * row.overlay.scale)));
  }, [row.overlay.scale]);
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
    setClean(false);
    setSourceName("");
  }
  useEffect(() => {
    if (!active) stop();
  }, [active]);
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
    let candidate: MediaStream | null = null;
    setLoading(true);
    setError("");
    try {
      const next = await captureStudioSource(
        navigator.mediaDevices,
        source,
        selected,
      );
      if (version !== request.current) {
        stopMedia(next);
        return;
      }
      candidate = next;
      stopMedia(stream.current);
      stream.current = next;
      const track = next.getVideoTracks()[0];
      if (source === "camera")
        setDevice(track.getSettings().deviceId || selected);
      setSourceName(
        track.label ||
          (source === "screen" ? t("sourceNameScreen") : t("sourceNameCamera")),
      );
      track.addEventListener("ended", () => {
        if (stream.current === next) {
          stopMedia(next);
          stream.current = null;
          if (video.current) video.current.srcObject = null;
          setReady(false);
          setClean(false);
          if (document.fullscreenElement === stage.current)
            void document.exitFullscreen().catch(() => {});
          setError(
            source === "screen"
              ? t("errorScreenEnded")
              : t("errorCameraDisconnected"),
          );
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
      setReady(track.readyState === "live");
      if (source === "camera") void listCameras();
    } catch (e) {
      if (candidate) stopMedia(candidate);
      if (version === request.current) {
        if (candidate && stream.current === candidate) {
          stream.current = null;
          if (video.current) video.current.srcObject = null;
        }
        setReady(
          !!stream.current
            ?.getVideoTracks()
            .some((track) => track.readyState === "live"),
        );
        setError(t(source === "screen" ? screenError(e) : cameraError(e)));
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
      setError(errorMessage(e instanceof Error ? e.message : undefined));
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
  // Scale the whole saved layout; never squeeze its name column independently.
  const boardWidth = boardLayoutWidth(
    row.overlay.template,
    row.overlay.customDesign,
  );
  const boardScale = (stageWidth * size) / 100 / boardWidth;
  const travelX = Math.max(0, stageWidth - boardWidth * boardScale);
  const travelY = Math.max(0, stageHeight - boardHeight * boardScale);
  const clamp = (value: number) => Math.max(0, Math.min(1, value));
  const movable = !clean && row.overlay.showScoreboard !== false;
  const clock = matchClock(row),
    finished = row.status === "finished";
  const Root = embedded ? "div" : "main";
  return (
    <Root
      className={`${embedded ? "pbw-embedded-studio" : "pbw"} pbw-studio ${focused ? "pbw-studio-focused" : ""} ${clean ? "pbw-studio-clean" : ""}`}
    >
      {!clean && !embedded && (
        <>
          <WorkspaceHeader
            matchCode={row.short_code}
            matchName={row.overlay.tournamentName}
          />
          <div className="pbw-title">
            <div>
              <span className="pbw-eyebrow">{t("eyebrow")}</span>
              <h1>{focused ? t("titleFocused") : t("title")}</h1>
              <p>{t("lead")}</p>
            </div>
            <span className="pbw-badge">
              {ready ? t("badgeReady") : t("badgeOff")}
            </span>
          </div>
        </>
      )}
      <div className="pbw-studio-grid">
        <section>
          <div
            ref={stage}
            className="pbw-camera-stage"
            aria-label={t("stageAria")}
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
              style={{
                transform:
                  source === "camera" && mirror ? "scaleX(-1)" : undefined,
                objectFit: source === "screen" ? "contain" : "cover",
              }}
            />
            {!ready && (
              <div className="pbw-camera-empty">
                <span className="pbw-hand">{t("emptyHand")}</span>
                <p>
                  {loading
                    ? t("emptyLoading")
                    : source === "screen"
                      ? t("emptyScreen")
                      : t("emptyCamera")}
                </p>
              </div>
            )}
            <div
              ref={boardElement}
              className={`pbw-camera-board ${placement ? "" : position} ${movable ? "is-draggable" : ""}`}
              tabIndex={movable ? 0 : undefined}
              role={movable ? "group" : undefined}
              aria-label={movable ? t("boardAria") : undefined}
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
          {!clean && !embedded && (
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
                    ? t("clockFinished")
                    : clock.runningSince
                      ? t("clockPause")
                      : row.started_at
                        ? t("clockResume")
                        : t("clockStart")}
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
                    <b>{t("pointAdd")}</b>
                  </button>
                ))}
              </div>
              <button
                className="pbw-secondary"
                disabled={busy || !row.overlay.scoreHistory?.length}
                onClick={() => void act({ kind: "undo" })}
              >
                {t("undo")}
              </button>
              <a
                className="pbw-text-link"
                href={`/m/${row.short_code}`}
                target="_blank"
                rel="noreferrer"
              >
                {t("openControls")}
              </a>
            </section>
          )}
        </section>
        {!clean && !focused && (
          <aside className="pbw-card pbw-studio-controls">
            <h2>{t("controlsTitle")}</h2>
            {!embedded && (
              <button className="pbw-primary" onClick={() => setFocused(true)}>
                {t("focusEnter")}
              </button>
            )}
            <label>
              {t("sourceLabel")}
              <select
                value={source}
                onChange={(e) => {
                  stop();
                  setError("");
                  setSource(e.target.value as "camera" | "screen");
                }}
              >
                <option value="camera">{t("sourceCamera")}</option>
                <option value="screen">{t("sourceScreen")}</option>
              </select>
            </label>
            {source === "camera" && (
              <>
                <label>
                  {t("cameraLabel")}
                  <select
                    value={device}
                    disabled={loading}
                    onChange={(e) => {
                      setDevice(e.target.value);
                      if (ready) void start(e.target.value);
                    }}
                  >
                    <option value="">{t("cameraDefault")}</option>
                    {devices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || t("cameraFallback", { number: i + 1 })}
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
                    ? t("cameraConnecting")
                    : ready
                      ? t("cameraStop")
                      : t("cameraStart")}
                </button>
                <label className="pbw-toggle">
                  <input
                    type="checkbox"
                    checked={mirror}
                    onChange={(e) => setMirror(e.target.checked)}
                  />
                  {t("cameraMirror")}
                </label>
              </>
            )}
            {source === "screen" && (
              <>
                <p className="pbw-muted">{t("screenHint")}</p>
                <button
                  className="pbw-primary"
                  disabled={loading}
                  onClick={() => void start()}
                >
                  {loading
                    ? t("screenChoosing")
                    : ready
                      ? t("screenChooseAnother")
                      : t("screenChoose")}
                </button>
                {ready && (
                  <>
                    <p className="pbw-muted" role="status">
                      {t("screenSharing", { name: sourceName })}
                    </p>
                    <button className="pbw-secondary" onClick={stop}>
                      {t("screenStop")}
                    </button>
                  </>
                )}
                <p className="pbw-muted">{t("screenNote")}</p>
              </>
            )}
            <label>
              {t("positionLabel")}
              <select
                value={placement ? "custom" : position}
                onChange={(e) => {
                  setPlacement(null);
                  setPosition(e.target.value as typeof position);
                }}
              >
                {placement && (
                  <option value="custom" disabled>
                    {t("positionCustom")}
                  </option>
                )}
                {(
                  [
                    ["top-left", "editorPositionTopLeft"],
                    ["top-right", "editorPositionTopRight"],
                    ["bottom-left", "editorPositionBottomLeft"],
                    ["bottom-right", "editorPositionBottomRight"],
                  ] as const
                ).map(([p, labelKey]) => (
                  <option key={p} value={p}>
                    {tWorkspace(labelKey)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="pbw-muted">{t("positionHint")}</span>
              {t("sizeLabel", { percent: size })}
              <input
                type="range"
                min="10"
                max="80"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
            </label>
            {!embedded && (
              <>
                <label className="pbw-toggle">
                  <input
                    type="checkbox"
                    checked={row.overlay.showTimer}
                    disabled={busy}
                    onChange={(e) =>
                      void act({ kind: "show_timer", value: e.target.checked })
                    }
                  />
                  {t("showTimer")}
                </label>
                <p className="pbw-muted">{t("timerHint")}</p>
                <Link
                  className="pbw-text-link"
                  href={`/m/${row.short_code}/edit`}
                >
                  {t("editDesign")}
                </Link>
              </>
            )}
            <hr />
            <h3>{t("shareTitle")}</h3>
            <ol className="pbw-share-steps">
              <li>{t("shareStepOne")}</li>
              <li>{t("shareStepTwo")}</li>
              <li>{t("shareStepThree")}</li>
            </ol>
            <button
              className="pbw-primary"
              disabled={!ready}
              onClick={() => void shareView()}
            >
              {t("cleanView")}
            </button>
            <p className="pbw-muted">{t("cleanHint")}</p>
          </aside>
        )}
      </div>
      {!clean && focused && (
        <section className="pbw-card pbw-focus-tools">
          {!embedded && (
            <>
              <button
                className="pbw-secondary"
                onClick={() => setFocused(false)}
              >
                {t("focusAdjust")}
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
                  ? t("focusShowScoreboard")
                  : t("focusHideScoreboard")}
              </button>
              <button
                className="pbw-secondary"
                disabled={busy}
                aria-pressed={row.overlay.showTimer}
                onClick={() =>
                  void act({
                    kind: "show_timer",
                    value: !row.overlay.showTimer,
                  })
                }
              >
                {row.overlay.showTimer
                  ? t("focusHideTimer")
                  : t("focusShowTimer")}
              </button>
            </>
          )}
          <button
            className="pbw-primary"
            disabled={!ready}
            onClick={() => void shareView()}
          >
            {t("cleanView")}
          </button>
        </section>
      )}
      {!clean && error && (
        <p className="pbw-error" role="alert">
          {error}
        </p>
      )}
    </Root>
  );
}
