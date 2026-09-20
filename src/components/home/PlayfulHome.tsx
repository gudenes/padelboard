"use client";
import { PublicHeader } from "./PublicHeader";
import { HeroScoreDemo } from "./HeroScoreDemo";
import { editableTemplate } from "@/lib/template-design";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowBendDownLeft,
  ArrowUUpLeft,
  Check,
  Lightning,
  Monitor,
  Palette,
  ShareNetwork,
  X,
  Plus,
  SlidersHorizontal,
  Play,
} from "@phosphor-icons/react";
import {
  apply,
  createInitialState,
  type MatchState,
  type MatchConfig,
  type TeamId,
} from "@/lib/padel-scoring";
import { defaultConfig, defaultOverlay } from "@/types/match";
import { clearDraftToken, saveDraftToken } from "@/lib/draft-token";
import { TourScoreboard as Scoreboard } from "@/components/scoreboard/TourScoreboard";
import {
  BOARD_STYLES,
  getBoardStyle,
  type BoardStyleId,
} from "@/lib/board-styles";
import { doublesTeams, type DoublesPlayers } from "@/lib/doubles";
import { DEUCE_RULES, getDeuceRule, isStarPoint } from "@/lib/padel-scoring";
import { BrandBoardGenerator } from "@/components/scoreboard/BrandBoardGenerator";
import { CustomBoardEditor } from "@/components/scoreboard/CustomBoardEditor";
import {
  DEFAULT_CUSTOM_DESIGN,
  type CustomBoardDesign,
} from "@/lib/custom-board";
import { FinishSetup } from "@/components/workspace/FinishSetup";
import { reusableOverlay, type SavedBoardSetup } from "@/lib/reuse-board";
import { useRouter } from "next/navigation";
import "./playful.css";

const accents = [
  { name: "Court yellow", value: "#f5ff36" },
  { name: "Rally pink", value: "#ff95c7" },
  { name: "Club mint", value: "#9af0ce" },
  { name: "Sky blue", value: "#99caff" },
];
const exampleState: MatchState = {
  ...createInitialState(defaultConfig()),
  sets: [
    { a: 6, b: 3 },
    { a: 4, b: 6 },
  ],
  currentGame: { a: 30, b: 15 },
};

export function PlayfulHome({
  liveAvailable,
  aiAvailable = false,
  workspace = false,
  initialBoard,
  onSwitchBoard,
}: {
  liveAvailable: boolean;
  aiAvailable?: boolean;
  workspace?: boolean;
  initialBoard?: SavedBoardSetup;
  onSwitchBoard?: () => void;
}) {
  const router = useRouter();
  const initialStyle =
    BOARD_STYLES.find((style) => style.id === initialBoard?.overlay.template)
      ?.id ?? "padelboard";
  const initialAccent =
    initialBoard?.overlay.customColors?.accent?.color ?? accents[0].value;
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const draft = useRef<{
    id: string;
    shortCode: string;
    draftToken: string;
  } | null>(null);
  const [players, setPlayers] = useState<DoublesPlayers>(
    initialBoard
      ? ([
          ...initialBoard.teams.a.players,
          ...initialBoard.teams.b.players,
        ] as DoublesPlayers)
      : ["Galán", "Chingotto", "Coello", "Tapia"],
  );
  const teams = doublesTeams(players);
  const names: [string, string] = [teams.a.name, teams.b.name];
  const [customDesign, setCustomDesign] = useState<CustomBoardDesign>({
    ...DEFAULT_CUSTOM_DESIGN,
    ...initialBoard?.overlay.customDesign,
  });
  const customAccent = useRef(initialAccent);
  const [lookPath, setLookPath] = useState<"templates" | "custom" | null>(
    initialBoard ? (initialStyle === "custom" ? "custom" : "templates") : null,
  );
  const editorOpen = lookPath === "custom";
  const [templatePage, setTemplatePage] = useState(0);
  const savedTemplate = useRef<{ id: BoardStyleId; accent: string }>({
    id: initialStyle,
    accent: initialAccent,
  });
  const [editorMode, setEditorMode] = useState<"ai" | "manual">("ai");
  const [boardStyle, setBoardStyle] = useState<BoardStyleId>(initialStyle);
  const [exampleStyle, setExampleStyle] = useState<BoardStyleId>("padelboard");
  const [exampleAccent, setExampleAccent] = useState<string>(accents[0].value);
  const [title, setTitle] = useState(
    initialBoard?.overlay.tournamentName ?? "Friday night padel",
  );
  const [accent, setAccent] = useState(initialAccent);
  const [config, setConfig] = useState<MatchConfig>(
    initialBoard?.config ?? defaultConfig,
  );
  const [setupStep, setSetupStep] = useState(1);
  const [stage, setStage] = useState<"setup" | "play" | "account">("setup");
  const [history, setHistory] = useState<MatchState[]>([
    createInitialState(defaultConfig()),
  ]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const state = history[history.length - 1];

  useEffect(() => {
    dialog.current?.querySelector(".pb-step-body")?.scrollTo({ top: 0 });
  }, [setupStep, lookPath, stage, editorMode]);

  function chooseLookPath(path: "templates" | "custom") {
    if (boardStyle === "custom") customAccent.current = accent;
    else savedTemplate.current = { id: boardStyle, accent };
    setLookPath(path);
    setBoardStyle(path === "custom" ? "custom" : savedTemplate.current.id);
    setAccent(
      path === "custom" ? customAccent.current : savedTemplate.current.accent,
    );
    requestAnimationFrame(() => {
      dialog.current?.scrollTo({ top: 0 });
      document.getElementById("setup-title")?.focus({ preventScroll: true });
    });
  }
  function openSetup() {
    opener.current = document.activeElement as HTMLElement;
    setError("");
    dialog.current?.showModal();
    document.body.style.overflow = "hidden";
  }
  function closeSetup() {
    if (workspace) {
      router.push("/dashboard");
      return;
    }
    dialog.current?.close();
    document.body.style.overflow = "";
    opener.current?.focus();
  }
  function startPreview() {
    setHistory([createInitialState(config)]);
    setStage("play");
    setError("");
    requestAnimationFrame(() => dialog.current?.scrollTo({ top: 0 }));
  }
  function point(team: TeamId) {
    setHistory((previous) => {
      const last = previous[previous.length - 1];
      return last.phase === "finished"
        ? previous
        : [...previous, apply(last, { kind: "point_for", team })];
    });
  }
  async function createLiveBoard() {
    if (!liveAvailable || creating) return;
    setCreating(true);
    setError("");
    try {
      if (!draft.current) {
        const response = await fetch("/api/matches", { method: "POST" });
        if (!response.ok)
          throw new Error(
            "We couldn’t save your board. Your setup is still here. Please try again.",
          );
        draft.current = await response.json();
      }
      const saved = draft.current!;
      saveDraftToken(saved.id, saved.draftToken);
      const response = await fetch(`/api/matches/${saved.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          draftToken: saved.draftToken,
          teams,
          config,
          overlay: {
            ...(initialBoard
              ? reusableOverlay(initialBoard.overlay)
              : defaultOverlay()),
            tournamentName: title,
            template: boardStyle,
            customDesign: boardStyle === "custom" ? customDesign : undefined,
            customColors: { accent: { color: accent } },
          },
        }),
      });
      if (!response.ok)
        throw new Error(
          "Your draft was saved, but its settings couldn’t be updated. Please try again.",
        );
      if (workspace) {
        const claim = await fetch(`/api/matches/${saved.id}/claim`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ draftToken: saved.draftToken }),
        });
        if (!claim.ok)
          throw new Error(
            (await claim.json()).error ||
              "Could not open your match. Please retry.",
          );
        clearDraftToken(saved.id);
        router.push(`/m/${saved.shortCode}`);
      } else setStage("account");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className={`pb-home ${workspace ? "pb-workspace-create" : ""}`}>
      {!workspace && (
        <>
          <div className="pb-sunshine">
            <PublicHeader />
            <main>
              <section
                className="pb-hero pb-container"
                aria-labelledby="hero-title"
              >
                <div className="pb-hero-copy">
                  <p className="pb-hand pb-eyebrow">
                    STREAM
                    <br />
                    MORE PADEL.
                  </p>
                  <h1 id="hero-title">
                    Professional
                    <br />
                    scoreboards.
                    <br />
                    In seconds.
                  </h1>
                  <p className="pb-hero-description">
                    Create beautiful, real-time padel scoreboards
                    <br className="pb-desktop-break" /> for OBS, StreamYard or
                    your favorite streaming
                    <br className="pb-desktop-break" /> software. No account
                    needed to try.
                  </p>
                  <div className="pb-cta-group">
                    <button
                      className="pb-button pb-primary"
                      onClick={openSetup}
                    >
                      Create your board <ArrowRight weight="bold" />
                    </button>
                    <span className="pb-hand pb-cta-note">
                      <ArrowBendDownLeft weight="bold" />
                      FREE.
                      <br />
                      NO FUSS.
                      <br />
                      JUST PLAY.
                    </span>
                  </div>
                </div>
                <div
                  className="pb-hero-visual"
                  aria-label="Example of a Padelboard scoreboard"
                >
                  <p className="pb-hand pb-board-note">
                    LOOKS GREAT
                    <br />
                    ON STREAM.
                    <ArrowBendDownLeft weight="bold" />
                  </p>
                  <HeroScoreDemo />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/padel-ball.png"
                    alt=""
                    className="pb-ball"
                    width="1254"
                    height="1254"
                  />
                  <button className="pb-preview-link" onClick={openSetup}>
                    <Play weight="fill" /> Make it yours
                  </button>
                </div>
              </section>
              <section
                id="features"
                className="pb-features pb-container"
                aria-label="Features"
              >
                {[
                  {
                    Icon: Lightning,
                    title: "Real-time scoring",
                    text: "Tap a point. Your stream keeps up.",
                  },
                  {
                    Icon: Monitor,
                    title: "Stream ready",
                    text: "Works with OBS, StreamYard, vMix and more.",
                  },
                  {
                    Icon: Palette,
                    title: "Make it yours",
                    text: "Your players, your colors, your match.",
                  },
                  {
                    Icon: ShareNetwork,
                    title: "No installation",
                    text: "One browser. All you need to get going.",
                  },
                ].map(({ Icon, title: heading, text }) => (
                  <div className="pb-feature" key={heading}>
                    <Icon weight="bold" />
                    <h2>{heading}</h2>
                    <p>{text}</p>
                  </div>
                ))}
              </section>
              <div className="pb-tagline">
                <span />
                SCORE <b>·</b> STREAM <b>·</b> PADEL
                <span />
              </div>
            </main>
          </div>
          <section id="how-it-works" className="pb-section pb-container">
            <p className="pb-section-label">LESS SETUP. MORE MATCH.</p>
            <h2>Ready before the warm-up.</h2>
            <div className="pb-steps">
              {[
                {
                  title: "Make it your match.",
                  text: "Add your players, choose a color, and set the rules. See your board change as you go.",
                },
                {
                  title: "Give it a quick rally.",
                  text: "Try the scoring controls for free. Golden point, deuce, and tiebreaks are taken care of.",
                },
                {
                  title: "Take it to your stream.",
                  text: "Sign in to publish, copy your overlay link, and add it as a browser source. You’re on.",
                },
              ].map((step, i) => (
                <article key={step.title}>
                  <span className="pb-step-number">0{i + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>
          </section>
          <section id="examples" className="pb-examples">
            <div className="pb-container pb-examples-inner">
              <div>
                <p className="pb-section-label">YOUR CLUB. YOUR COLORS.</p>
                <h2>
                  A little more <br />
                  you. A lot more <br />
                  match day.
                </h2>
                <p>
                  From the Friday-night friendly to the club final.
                  <br />
                  There’s a board with your name on it.
                </p>
                <button
                  className="pb-button"
                  onClick={() => {
                    setBoardStyle(exampleStyle);
                    setAccent(exampleAccent);
                    savedTemplate.current = {
                      id: exampleStyle,
                      accent: exampleAccent,
                    };
                    setLookPath("templates");
                    setTemplatePage(
                      Math.floor(
                        BOARD_STYLES.findIndex(
                          (style) => style.id === exampleStyle,
                        ) / 4,
                      ),
                    );
                    openSetup();
                  }}
                >
                  Use this look <ArrowRight weight="bold" />
                </button>
              </div>
              <div className="pb-example-preview">
                <div
                  className="pb-example-templates"
                  role="group"
                  aria-label="Example scoreboard template"
                >
                  {BOARD_STYLES.filter((style) => style.id !== "custom").map(
                    (style) => (
                      <button
                        key={style.id}
                        aria-pressed={exampleStyle === style.id}
                        onClick={() => {
                          setExampleStyle(style.id);
                          setExampleAccent(style.accent);
                        }}
                      >
                        {style.name}
                      </button>
                    ),
                  )}
                </div>
                <div className="pb-example-board" key={exampleStyle}>
                  <Scoreboard
                    names={["Alex / Sam", "Dani / Nico"]}
                    players={["Alex", "Sam", "Dani", "Nico"]}
                    state={exampleState}
                    variant={exampleStyle}
                    accent={exampleAccent}
                    title="FRIDAY NIGHT · COURT 01"
                  />
                </div>
                <div
                  className="pb-swatches"
                  aria-label="Example scoreboard color"
                >
                  {accents.map((color) => (
                    <button
                      key={color.value}
                      style={{ background: color.value }}
                      aria-label={color.name}
                      aria-pressed={exampleAccent === color.value}
                      onClick={() => setExampleAccent(color.value)}
                    >
                      {exampleAccent === color.value && <Check weight="bold" />}
                    </button>
                  ))}
                  <span>Make it your colors.</span>
                </div>
              </div>
            </div>
          </section>
          <section id="faq" className="pb-section pb-faq pb-container">
            <div>
              <p className="pb-section-label">GOOD QUESTION.</p>
              <h2>
                A few things
                <br />
                before first serve.
              </h2>
            </div>
            <div>
              {[
                {
                  q: "Do I need an account?",
                  a: "You can customize a board and try the scoring controls without an account. Sign in when you’re ready to publish a live board and share its overlay.",
                },
                {
                  q: "How does it work with my stream?",
                  a: "Once your board is published, add its overlay URL as a browser source in your streaming software. Control the match from your browser while the overlay shows the score.",
                },
                {
                  q: "Does it understand padel scoring?",
                  a: "Yes. Star Point, golden point, advantage, set tiebreaks, and a deciding super-tiebreak are built in. Choose your match format during setup.",
                },
                {
                  q: "Can I fix an accidental point?",
                  a: "Of course. Tap Undo to go back a point. Try it in the preview — no pressure.",
                },
              ].map((item) => (
                <details key={item.q}>
                  <summary>
                    {item.q}
                    <Plus weight="bold" />
                  </summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        </>
      )}
      <dialog
        open={workspace || undefined}
        ref={dialog}
        className="pb-dialog"
        aria-labelledby="setup-title"
        onCancel={() => {
          document.body.style.overflow = "";
        }}
        onClick={(event) => {
          if (!workspace && event.target === dialog.current) closeSetup();
        }}
      >
        <div className="pb-setup">
          <div className="pb-setup-header">
            <span className="pb-wordmark">padelboard</span>
            {workspace && (
              <div className="pb-reuse-board">
                <span>
                  {initialBoard
                    ? "Your latest board · fresh match"
                    : "A brand-new board"}
                </span>
                {onSwitchBoard && (
                  <button
                    type="button"
                    onClick={onSwitchBoard}
                    disabled={creating}
                  >
                    {initialBoard
                      ? "Create a new board instead"
                      : "Use my latest board"}
                  </button>
                )}
              </div>
            )}
            <button
              className="pb-icon-button"
              aria-label={workspace ? "Back to my matches" : "Close setup"}
              onClick={closeSetup}
            >
              <X weight="bold" />
            </button>
          </div>
          <div className="pb-setup-grid">
            <div
              className={`pb-setup-form ${stage === "setup" && setupStep === 2 && editorOpen ? "pb-custom-step" : ""}`}
            >
              <p className="pb-section-label">
                {stage === "setup"
                  ? "YOUR MATCH STARTS HERE"
                  : stage === "account"
                    ? "YOUR BOARD IS SAVED"
                    : "GIVE IT A QUICK RALLY"}
              </p>
              <h2 id="setup-title" tabIndex={-1}>
                {stage === "setup"
                  ? setupStep === 2 && lookPath === null
                    ? "How will you make it yours?"
                    : setupStep === 2 && editorOpen
                      ? "Make it yours."
                      : [
                          "Who’s on court?",
                          "Find your match-day look.",
                          "Your match. Your rules.",
                        ][setupStep - 1]
                  : stage === "account"
                    ? "Make it official."
                    : "You call the points."}
              </h2>
              {stage === "account" && draft.current ? (
                <FinishSetup
                  matchId={draft.current.id}
                  shortCode={draft.current.shortCode}
                />
              ) : stage === "setup" ? (
                <form
                  key={`${setupStep}-${lookPath}`}
                  className="pb-step-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (setupStep === 2 && lookPath === null) return;
                    if (setupStep === 1 && !initialBoard) setLookPath(null);
                    if (setupStep < 3) {
                      setSetupStep((step) => step + 1);
                      requestAnimationFrame(() =>
                        dialog.current?.scrollTo({ top: 0 }),
                      );
                    } else startPreview();
                  }}
                >
                  <ol className="pb-setup-steps" aria-label="Setup progress">
                    {["Players", "Look", "Rules"].map((label, i) => (
                      <li
                        key={label}
                        aria-current={setupStep === i + 1 ? "step" : undefined}
                        className={setupStep >= i + 1 ? "is-active" : ""}
                      >
                        <span>{i + 1}</span>
                        {label}
                      </li>
                    ))}
                  </ol>
                  <div className="pb-step-body pb-step-transition">
                    {setupStep === 1 && (
                      <>
                        <div className="pb-pairs">
                          {(["Pair one", "Pair two"] as const).map(
                            (pair, i) => (
                              <fieldset className="pb-pair" key={pair}>
                                <legend>
                                  {pair}
                                  <span>DOUBLES</span>
                                </legend>
                                <div className="pb-player-inputs">
                                  {[0, 1].map((member) => {
                                    const index = i * 2 + member;
                                    return (
                                      <label className="pb-field" key={index}>
                                        Player {member + 1}
                                        <input
                                          autoFocus={index === 0}
                                          required
                                          pattern=".*\S.*"
                                          maxLength={24}
                                          aria-label={`${pair}, player ${member + 1}`}
                                          value={players[index]}
                                          onFocus={(event) =>
                                            event.currentTarget.select()
                                          }
                                          onChange={(event) =>
                                            setPlayers(
                                              (previous) =>
                                                previous.map((value, n) =>
                                                  n === index
                                                    ? event.target.value
                                                    : value,
                                                ) as DoublesPlayers,
                                            )
                                          }
                                          placeholder={
                                            [
                                              "e.g. Galán",
                                              "e.g. Chingotto",
                                              "e.g. Coello",
                                              "e.g. Tapia",
                                            ][index]
                                          }
                                        />
                                      </label>
                                    );
                                  })}
                                </div>
                              </fieldset>
                            ),
                          )}
                          <p className="pb-input-hint">
                            Four players. Two pairs. We’ll put the names
                            together.
                          </p>
                        </div>
                        <label className="pb-field">
                          Match name <span>optional</span>
                          <input
                            maxLength={48}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Friday night padel"
                          />
                        </label>
                      </>
                    )}
                    {setupStep === 2 && lookPath === null && (
                      <div className="pb-look-paths">
                        <p>
                          Pick a match-ready look, or bring your own
                          personality.
                        </p>
                        <button
                          type="button"
                          className="pb-look-path"
                          onClick={() => chooseLookPath("templates")}
                        >
                          <div
                            className="pb-path-art pb-path-presets"
                            aria-hidden="true"
                          >
                            <Scoreboard
                              names={names}
                              players={players}
                              state={exampleState}
                              accent="#e7c87d"
                              variant="tour-premier"
                              title="MATCH DAY"
                            />
                            <Scoreboard
                              names={names}
                              players={players}
                              state={exampleState}
                              accent="#1764ae"
                              variant="tour-fip"
                              title="YOUR CLUB"
                            />
                          </div>
                          <span className="pb-path-title">
                            Pick a template <ArrowRight />
                          </span>
                          <span className="pb-path-description">
                            Premier, FIP, APT & more. Ready for first serve.
                          </span>
                        </button>
                        <button
                          type="button"
                          className="pb-look-path"
                          onClick={() => chooseLookPath("custom")}
                        >
                          <div
                            className="pb-path-art pb-path-custom"
                            aria-hidden="true"
                          >
                            <Scoreboard
                              names={names}
                              players={players}
                              state={exampleState}
                              accent="#ff95c7"
                              variant="custom"
                              customDesign={{
                                ...customDesign,
                                background: "#173f37",
                                rowBackground: "#205346",
                                textColor: "#ffffff",
                              }}
                              title="YOUR BRAND. YOUR BOARD."
                            />
                            <span className="pb-path-swatches">
                              <i />
                              <i />
                              <i />
                              <i />
                            </span>
                          </div>
                          <span className="pb-path-title">
                            Create your own <ArrowRight />
                          </span>
                          <span className="pb-path-description">
                            From your website, from your logo, or from scratch.
                          </span>
                        </button>
                      </div>
                    )}
                    {setupStep === 2 && lookPath === "templates" && (
                      <>
                        <fieldset className="pb-template-field">
                          <legend>Choose your look</legend>
                          <p>Tour-inspired styles. Always padel rules.</p>
                          <div className="pb-template-grid">
                            {BOARD_STYLES.filter(
                              (style) => style.id !== "custom",
                            )
                              .slice(templatePage * 4, templatePage * 4 + 4)
                              .map((style) => (
                                <button
                                  type="button"
                                  key={style.id}
                                  className={`pb-template-card ${boardStyle === style.id ? "is-selected" : ""}`}
                                  aria-label={`${style.name} template`}
                                  aria-pressed={boardStyle === style.id}
                                  onClick={() => {
                                    setBoardStyle(style.id);
                                    if (boardStyle === "custom")
                                      customAccent.current = accent;
                                    setAccent(style.accent);

                                    requestAnimationFrame(() => {
                                      dialog.current?.scrollTo({ top: 0 });
                                      document
                                        .getElementById("setup-title")
                                        ?.focus({ preventScroll: true });
                                    });
                                  }}
                                >
                                  <div
                                    className="pb-template-thumb"
                                    aria-hidden="true"
                                  >
                                    <Scoreboard
                                      names={[
                                        "GALÁN / CHINGOTTO",
                                        "COELLO / TAPIA",
                                      ]}
                                      players={[
                                        "Galán",
                                        "Chingotto",
                                        "Coello",
                                        "Tapia",
                                      ]}
                                      state={exampleState}
                                      accent={style.accent}
                                      title="FINAL · COURT 01"
                                      variant={style.id}
                                    />
                                  </div>
                                  <span className="pb-template-name">
                                    {style.name}
                                    {boardStyle === style.id && (
                                      <Check weight="bold" />
                                    )}
                                  </span>
                                  <small>{style.note}</small>
                                </button>
                              ))}
                          </div>
                          <div
                            className="pb-template-pages"
                            aria-label="Template pages"
                          >
                            <button
                              type="button"
                              disabled={templatePage === 0}
                              onClick={() => setTemplatePage(0)}
                            >
                              Previous
                            </button>
                            <span>{templatePage + 1} / 2</span>
                            <button
                              type="button"
                              disabled={templatePage === 1}
                              onClick={() => setTemplatePage(1)}
                            >
                              More templates
                            </button>
                          </div>
                        </fieldset>
                        {boardStyle !== "custom" && (
                          <fieldset className="pb-color-field">
                            <legend>Accent color</legend>
                            <button
                              type="button"
                              className="pb-reset-color"
                              onClick={() =>
                                setAccent(getBoardStyle(boardStyle).accent)
                              }
                            >
                              Use template color
                            </button>
                            <div className="pb-swatches">
                              {accents.map((color) => (
                                <button
                                  type="button"
                                  key={color.value}
                                  aria-label={`Use ${color.name}`}
                                  aria-pressed={accent === color.value}
                                  style={{ background: color.value }}
                                  onClick={() => setAccent(color.value)}
                                >
                                  {accent === color.value && (
                                    <Check weight="bold" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </fieldset>
                        )}
                      </>
                    )}
                    {setupStep === 2 && lookPath === "templates" && (
                      <button
                        type="button"
                        className="pb-fine-tune-template"
                        onClick={() => {
                          savedTemplate.current = { id: boardStyle, accent };
                          setCustomDesign(editableTemplate(boardStyle, accent));
                          customAccent.current = accent;
                          setBoardStyle("custom");
                          setLookPath("custom");
                          setEditorMode("manual");
                        }}
                      >
                        Fine-tune this template →
                      </button>
                    )}
                    {setupStep === 2 && editorOpen && (
                      <div className="pb-editor-workspace">
                        <p className="pb-editor-intro">
                          Your own look, down to the last detail.
                        </p>
                        <div
                          className="pb-editor-modes"
                          role="group"
                          aria-label="Design method"
                        >
                          <button
                            type="button"
                            aria-pressed={editorMode === "ai"}
                            onClick={() => setEditorMode("ai")}
                          >
                            Design with AI
                          </button>
                          <button
                            type="button"
                            aria-pressed={editorMode === "manual"}
                            onClick={() => setEditorMode("manual")}
                          >
                            Fine-tune
                          </button>
                        </div>
                        <div
                          className="pb-editor-scroll"
                          role="region"
                          aria-label="Custom board settings"
                          tabIndex={0}
                        >
                          {editorMode === "ai" ? (
                            <BrandBoardGenerator
                              available={aiAvailable}
                              onApply={(result) => {
                                setCustomDesign(result.design);
                                setAccent(result.accent);
                                customAccent.current = result.accent;
                                setEditorMode("manual");
                              }}
                            />
                          ) : (
                            <CustomBoardEditor
                              design={customDesign}
                              accent={accent}
                              onChange={setCustomDesign}
                              onAccentChange={setAccent}
                            />
                          )}
                        </div>
                      </div>
                    )}
                    {setupStep === 3 && (
                      <div className="pb-rules">
                        <label className="pb-field">
                          Match format
                          <select
                            value={
                              config.format === "bo3" && config.superTiebreak
                                ? "two-sets-stb"
                                : config.format
                            }
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                format:
                                  e.target.value === "two-sets-stb"
                                    ? "bo3"
                                    : (e.target.value as MatchConfig["format"]),
                                superTiebreak:
                                  e.target.value === "two-sets-stb",
                              })
                            }
                          >
                            <option value="bo3">Best of 3 full sets</option>
                            <option value="two-sets-stb">
                              2 sets + deciding super-tiebreak
                            </option>
                            <option value="single-set">One set</option>
                            <option value="pro-set">
                              Pro set · first to 9
                            </option>
                          </select>
                        </label>
                        <fieldset className="pb-deuce-rules">
                          <legend>At 40–40</legend>
                          {DEUCE_RULES.map((rule) => (
                            <label
                              className={`pb-rule-option ${getDeuceRule(config) === rule.id ? "is-selected" : ""}`}
                              key={rule.id}
                            >
                              <input
                                type="radio"
                                name="deuce-rule"
                                value={rule.id}
                                checked={getDeuceRule(config) === rule.id}
                                onChange={() =>
                                  setConfig({
                                    ...config,
                                    deuceRule: rule.id,
                                    goldenPoint: rule.id === "golden-point",
                                  })
                                }
                              />
                              <span>
                                {rule.label}
                                <small>{rule.description}</small>
                              </span>
                            </label>
                          ))}
                        </fieldset>
                        {config.format === "bo3" && config.superTiebreak && (
                          <p className="pb-format-explanation">
                            Play two full sets. At one set each, play a
                            super-tiebreak: first to 10, win by two.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <footer className="pb-step-footer">
                    <div className="pb-step-navigation">
                      {setupStep > 1 && (
                        <button
                          type="button"
                          className="pb-edit-link"
                          onClick={() => {
                            if (setupStep === 2 && lookPath !== null)
                              setLookPath(null);
                            else setSetupStep((step) => step - 1);
                          }}
                        >
                          <ArrowUUpLeft />{" "}
                          {setupStep === 2 && lookPath !== null
                            ? "Back to look options"
                            : "Back"}
                        </button>
                      )}
                      {setupStep === 2 && lookPath !== null && (
                        <button
                          type="button"
                          className="pb-edit-link pb-switch-path"
                          onClick={() =>
                            chooseLookPath(editorOpen ? "templates" : "custom")
                          }
                        >
                          {editorOpen
                            ? "Switch to templates"
                            : "Create your own instead"}
                        </button>
                      )}
                    </div>
                    {(setupStep !== 2 || lookPath !== null) && (
                      <button
                        className="pb-button pb-form-submit"
                        type="submit"
                      >
                        {setupStep === 1
                          ? "Next: choose a look"
                          : setupStep === 2
                            ? editorOpen
                              ? "Use this board: match rules"
                              : "Next: match rules"
                            : "Try the controls"}{" "}
                        <ArrowRight weight="bold" />
                      </button>
                    )}
                    <p className="pb-fine-print">
                      No account. No commitment. Just a test rally.
                    </p>
                  </footer>
                </form>
              ) : (
                <div className="pb-controls">
                  <p>
                    Tap the team that won the point.
                    <br />
                    We’ll handle the padel math.
                  </p>
                  <div className="pb-point-buttons">
                    {(["a", "b"] as const).map((team, i) => (
                      <button
                        className="pb-point-button"
                        key={team}
                        onClick={() => point(team)}
                        disabled={state.phase === "finished"}
                      >
                        <span>{names[i]}</span>
                        <Plus weight="bold" />
                        <small>Add point</small>
                      </button>
                    ))}
                  </div>
                  <div className="pb-control-actions">
                    <button
                      onClick={() => setHistory((prev) => prev.slice(0, -1))}
                      disabled={history.length < 2}
                    >
                      <ArrowUUpLeft /> Undo point
                    </button>
                    <button onClick={startPreview}>Reset match</button>
                  </div>
                  <p className="pb-match-status" role="status">
                    {state.winner
                      ? `${names[state.winner === "a" ? 0 : 1]} wins. Good game!`
                      : state.phase === "playing"
                        ? `Set ${state.sets.length} · ${DEUCE_RULES.find((rule) => rule.id === getDeuceRule(config))?.label}`
                        : "Tiebreak · win by two"}
                  </p>
                  {isStarPoint(state) && (
                    <p className="pb-star-callout" role="status">
                      Star Point! Next point wins the game. The receiving pair
                      chooses the side.
                    </p>
                  )}
                  <button
                    className="pb-edit-link"
                    onClick={() => {
                      setStage("setup");
                      setSetupStep(1);
                      setError("");
                      requestAnimationFrame(() =>
                        dialog.current?.scrollTo({ top: 0 }),
                      );
                    }}
                  >
                    <SlidersHorizontal /> Edit your board
                  </button>
                  <div className="pb-go-live">
                    <h3>Looking good. Ready to stream?</h3>
                    <p>
                      {liveAvailable
                        ? workspace
                          ? "Your new match starts at zero. Your previous match stays saved in your history."
                          : "Save your board, then sign in to get your stream overlay. Your test points won’t carry over."
                        : "This local preview is ready to play. Publishing will be available once this app is connected to its database."}
                    </p>
                    <button
                      className="pb-button pb-form-submit"
                      onClick={createLiveBoard}
                      disabled={!liveAvailable || creating}
                    >
                      {creating ? "Saving your board…" : "Save & open controls"}
                      <ArrowRight weight="bold" />
                    </button>
                    {error && (
                      <p className="pb-error" role="alert">
                        {error}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <aside className="pb-setup-preview">
              <span className="pb-preview-badge">
                <Monitor weight="bold" />{" "}
                {getBoardStyle(boardStyle).name.toUpperCase()} · LIVE PREVIEW
              </span>
              <Scoreboard
                names={names}
                players={players}
                variant={boardStyle}
                customDesign={
                  boardStyle === "custom" ? customDesign : undefined
                }
                state={stage !== "play" ? createInitialState(config) : state}
                accent={accent}
                title={title.toUpperCase()}
              />
              <div className="pb-preview-footer">
                <p className="pb-hand">
                  Big match energy.
                  <br />
                  Tiny setup effort.
                </p>
                <span className="pb-preview-caption">
                  {stage === "setup"
                    ? "Your changes appear here as you make them."
                    : stage === "account"
                      ? "Saved. Looking good. Almost on court."
                      : "Practice mode · points stay in this tab."}
                </span>
              </div>
            </aside>
          </div>
        </div>
      </dialog>
    </div>
  );
}
