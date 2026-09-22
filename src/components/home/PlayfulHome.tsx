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
import { useTranslations } from "next-intl";
import { useApiErrorMessage } from "@/hooks/useApiError";
import "./playful.css";

const richTags = {
  br: () => <br />,
  brDesktop: () => <br className="pb-desktop-break" />,
  b: (chunks: React.ReactNode) => <b>{chunks}</b>,
  hl: (chunks: React.ReactNode) => <span>{chunks}</span>,
};

const accents = [
  { id: "court-yellow", value: "#f5ff36" },
  { id: "rally-pink", value: "#ff95c7" },
  { id: "club-mint", value: "#9af0ce" },
  { id: "sky-blue", value: "#99caff" },
] as const;

const playerExamples = ["Galán", "Chingotto", "Coello", "Tapia"] as const;
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
  const t = useTranslations("home");
  const w = useTranslations("wizard");
  const errorMessage = useApiErrorMessage();
  const boardStyleText = useTranslations("boardStyles");
  const ruleText = useTranslations("rules");
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
    initialBoard?.overlay.tournamentName ?? w("matchNamePlaceholder"),
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
        if (!response.ok) throw new Error(w("errorSaveBoard"));
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
      if (!response.ok) throw new Error(w("errorUpdateSettings"));
      if (workspace) {
        const claim = await fetch(`/api/matches/${saved.id}/claim`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ draftToken: saved.draftToken }),
        });
        if (!claim.ok)
          throw new Error(
            errorMessage((await claim.json()).error, w("errorOpenMatch")),
          );
        clearDraftToken(saved.id);
        router.push(`/m/${saved.shortCode}`);
      } else setStage("account");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : w("errorGeneric"));
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
                    {t.rich("heroScribble", richTags)}
                  </p>
                  <h1 id="hero-title">{t.rich("heroTitle", richTags)}</h1>
                  <p className="pb-hero-description">
                    {t.rich("heroLead", richTags)}
                  </p>
                  <div className="pb-cta-group">
                    <button
                      className="pb-button pb-primary"
                      onClick={openSetup}
                    >
                      {t("heroCta")} <ArrowRight weight="bold" />
                    </button>
                    <span className="pb-hand pb-cta-note">
                      <ArrowBendDownLeft weight="bold" />
                      {t.rich("heroFree", richTags)}
                    </span>
                  </div>
                </div>
                <div className="pb-hero-visual" aria-label={t("heroBoardAria")}>
                  <p className="pb-hand pb-board-note">
                    {t.rich("heroLooksGreat", richTags)}
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
                    <Play weight="fill" /> {t("heroMakeItYours")}
                  </button>
                </div>
              </section>
              <section
                id="features"
                className="pb-features pb-container"
                aria-label={t("featuresAria")}
              >
                {[
                  {
                    id: "scoring",
                    Icon: Lightning,
                    titleKey: "featureScoringTitle",
                    bodyKey: "featureScoringBody",
                  },
                  {
                    id: "stream",
                    Icon: Monitor,
                    titleKey: "featureStreamTitle",
                    bodyKey: "featureStreamBody",
                  },
                  {
                    id: "yours",
                    Icon: Palette,
                    titleKey: "featureYoursTitle",
                    bodyKey: "featureYoursBody",
                  },
                  {
                    id: "noInstall",
                    Icon: ShareNetwork,
                    titleKey: "featureNoInstallTitle",
                    bodyKey: "featureNoInstallBody",
                  },
                ].map(({ id, Icon, titleKey, bodyKey }) => (
                  <div className="pb-feature" key={id}>
                    <Icon weight="bold" />
                    <h2>{t(titleKey)}</h2>
                    <p>{t(bodyKey)}</p>
                  </div>
                ))}
              </section>
              <div className="pb-tagline">
                <span />
                {t.rich("tagline", richTags)}
                <span />
              </div>
            </main>
          </div>
          <section id="how-it-works" className="pb-section pb-container">
            <p className="pb-section-label">{t("stepsEyebrow")}</p>
            <h2>{t("stepsTitle")}</h2>
            <div className="pb-steps">
              {[
                {
                  id: "setup",
                  titleKey: "stepOneTitle",
                  bodyKey: "stepOneBody",
                },
                {
                  id: "rally",
                  titleKey: "stepTwoTitle",
                  bodyKey: "stepTwoBody",
                },
                {
                  id: "stream",
                  titleKey: "stepThreeTitle",
                  bodyKey: "stepThreeBody",
                },
              ].map(({ id, titleKey, bodyKey }, i) => (
                <article key={id}>
                  <span className="pb-step-number">0{i + 1}</span>
                  <h3>{t(titleKey)}</h3>
                  <p>{t(bodyKey)}</p>
                </article>
              ))}
            </div>
          </section>
          <section id="examples" className="pb-examples">
            <div className="pb-container pb-examples-inner">
              <div>
                <p className="pb-section-label">{t("examplesEyebrow")}</p>
                <h2>{t.rich("examplesTitle", richTags)}</h2>
                <p>{t.rich("examplesLead", richTags)}</p>
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
                  {t("examplesUseLook")} <ArrowRight weight="bold" />
                </button>
              </div>
              <div className="pb-example-preview">
                <div
                  className="pb-example-templates"
                  role="group"
                  aria-label={t("examplesTemplateAria")}
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
                  aria-label={t("examplesColorAria")}
                >
                  {accents.map((color) => (
                    <button
                      key={color.value}
                      style={{ background: color.value }}
                      aria-label={w(`accent.${color.id}`)}
                      aria-pressed={exampleAccent === color.value}
                      onClick={() => setExampleAccent(color.value)}
                    >
                      {exampleAccent === color.value && <Check weight="bold" />}
                    </button>
                  ))}
                  <span>{t("examplesColorsTitle")}</span>
                </div>
              </div>
            </div>
          </section>
          <section id="faq" className="pb-section pb-faq pb-container">
            <div>
              <p className="pb-section-label">{t("faqEyebrow")}</p>
              <h2>{t.rich("faqTitle", richTags)}</h2>
            </div>
            <div>
              {[
                {
                  id: "account",
                  questionKey: "faqAccountQ",
                  answerKey: "faqAccountA",
                },
                {
                  id: "stream",
                  questionKey: "faqStreamQ",
                  answerKey: "faqStreamA",
                },
                {
                  id: "scoring",
                  questionKey: "faqScoringQ",
                  answerKey: "faqScoringA",
                },
                {
                  id: "undo",
                  questionKey: "faqUndoQ",
                  answerKey: "faqUndoA",
                },
              ].map(({ id, questionKey, answerKey }) => (
                <details key={id}>
                  <summary>
                    {t(questionKey)}
                    <Plus weight="bold" />
                  </summary>
                  <p>{t(answerKey)}</p>
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
                <span>{w(initialBoard ? "reuseLatest" : "reuseNew")}</span>
                {onSwitchBoard && (
                  <button
                    type="button"
                    onClick={onSwitchBoard}
                    disabled={creating}
                  >
                    {w(initialBoard ? "reuseCreateNew" : "reuseUseLatest")}
                  </button>
                )}
              </div>
            )}
            <button
              className="pb-icon-button"
              aria-label={w(workspace ? "backToMatchesAria" : "closeAria")}
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
                {w(
                  stage === "setup"
                    ? "eyebrowSetup"
                    : stage === "account"
                      ? "eyebrowAccount"
                      : "eyebrowPlay",
                )}
              </p>
              <h2 id="setup-title" tabIndex={-1}>
                {w(
                  stage === "setup"
                    ? setupStep === 2 && lookPath === null
                      ? "titleLookPath"
                      : setupStep === 2 && editorOpen
                        ? "titleCustom"
                        : (
                            ["titlePlayers", "titleLook", "titleRules"] as const
                          )[setupStep - 1]
                    : stage === "account"
                      ? "titleAccount"
                      : "titlePlay",
                )}
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
                  <ol className="pb-setup-steps" aria-label={w("stepsAria")}>
                    {(["stepPlayers", "stepLook", "stepRules"] as const).map(
                      (labelKey, i) => (
                        <li
                          key={labelKey}
                          aria-current={
                            setupStep === i + 1 ? "step" : undefined
                          }
                          className={setupStep >= i + 1 ? "is-active" : ""}
                        >
                          <span>{i + 1}</span>
                          {w(labelKey)}
                        </li>
                      ),
                    )}
                  </ol>
                  <div className="pb-step-body pb-step-transition">
                    {setupStep === 1 && (
                      <>
                        <div className="pb-pairs">
                          {(["pairOne", "pairTwo"] as const).map(
                            (pairKey, i) => (
                              <fieldset className="pb-pair" key={pairKey}>
                                <legend>
                                  {w(pairKey)}
                                  <span>{w("pairFormat")}</span>
                                </legend>
                                <div className="pb-player-inputs">
                                  {[0, 1].map((member) => {
                                    const index = i * 2 + member;
                                    return (
                                      <label className="pb-field" key={index}>
                                        {w("playerN", { n: member + 1 })}
                                        <input
                                          autoFocus={index === 0}
                                          required
                                          pattern=".*\S.*"
                                          maxLength={24}
                                          aria-label={w("pairPlayerAria", {
                                            pair: w(pairKey),
                                            n: member + 1,
                                          })}
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
                                          placeholder={w("playerPlaceholder", {
                                            name: playerExamples[index],
                                          })}
                                        />
                                      </label>
                                    );
                                  })}
                                </div>
                              </fieldset>
                            ),
                          )}
                          <p className="pb-input-hint">{w("playersHint")}</p>
                        </div>
                        <label className="pb-field">
                          {w("matchNameLabel")}{" "}
                          <span>{w("matchNameOptional")}</span>
                          <input
                            maxLength={48}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={w("matchNamePlaceholder")}
                          />
                        </label>
                      </>
                    )}
                    {setupStep === 2 && lookPath === null && (
                      <div className="pb-look-paths">
                        <p>{w("lookPathLead")}</p>
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
                            {w("lookPathTemplates")} <ArrowRight />
                          </span>
                          <span className="pb-path-description">
                            {w("lookPathTemplatesBody")}
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
                            {w("lookPathCustom")} <ArrowRight />
                          </span>
                          <span className="pb-path-description">
                            {w("lookPathCustomBody")}
                          </span>
                        </button>
                      </div>
                    )}
                    {setupStep === 2 && lookPath === "templates" && (
                      <>
                        <fieldset className="pb-template-field">
                          <legend>{w("templateLegend")}</legend>
                          <p>{w("templateLead")}</p>
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
                                  aria-label={w("templateAria", {
                                    style: style.name,
                                  })}
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
                                  <small>{boardStyleText(style.id)}</small>
                                </button>
                              ))}
                          </div>
                          <div
                            className="pb-template-pages"
                            aria-label={w("templatePagesAria")}
                          >
                            <button
                              type="button"
                              disabled={templatePage === 0}
                              onClick={() => setTemplatePage(0)}
                            >
                              {w("templatePrevious")}
                            </button>
                            <span>{templatePage + 1} / 2</span>
                            <button
                              type="button"
                              disabled={templatePage === 1}
                              onClick={() => setTemplatePage(1)}
                            >
                              {w("templateMore")}
                            </button>
                          </div>
                        </fieldset>
                        {boardStyle !== "custom" && (
                          <fieldset className="pb-color-field">
                            <legend>{w("accentLegend")}</legend>
                            <button
                              type="button"
                              className="pb-reset-color"
                              onClick={() =>
                                setAccent(getBoardStyle(boardStyle).accent)
                              }
                            >
                              {w("accentUseTemplate")}
                            </button>
                            <div className="pb-swatches">
                              {accents.map((color) => (
                                <button
                                  type="button"
                                  key={color.value}
                                  aria-label={w("accentUse", {
                                    color: w(`accent.${color.id}`),
                                  })}
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
                        {w("fineTuneTemplate")}{" "}
                        <span aria-hidden="true">→</span>
                      </button>
                    )}
                    {setupStep === 2 && editorOpen && (
                      <div className="pb-editor-workspace">
                        <p className="pb-editor-intro">{w("editorIntro")}</p>
                        <div
                          className="pb-editor-modes"
                          role="group"
                          aria-label={w("editorModesAria")}
                        >
                          <button
                            type="button"
                            aria-pressed={editorMode === "ai"}
                            onClick={() => setEditorMode("ai")}
                          >
                            {w("editorModeAi")}
                          </button>
                          <button
                            type="button"
                            aria-pressed={editorMode === "manual"}
                            onClick={() => setEditorMode("manual")}
                          >
                            {w("editorModeManual")}
                          </button>
                        </div>
                        <div
                          className="pb-editor-scroll"
                          role="region"
                          aria-label={w("editorRegionAria")}
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
                          {w("formatLabel")}
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
                            <option value="bo3">{w("formatBo3")}</option>
                            <option value="two-sets-stb">
                              {w("formatTwoSetsStb")}
                            </option>
                            <option value="single-set">
                              {w("formatSingleSet")}
                            </option>
                            <option value="pro-set">{w("formatProSet")}</option>
                          </select>
                        </label>
                        <fieldset className="pb-deuce-rules">
                          <legend>{w("deuceLegend")}</legend>
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
                                {ruleText(rule.id)}
                                <small>
                                  {ruleText(`${rule.id}Description`)}
                                </small>
                              </span>
                            </label>
                          ))}
                        </fieldset>
                        {config.format === "bo3" && config.superTiebreak && (
                          <p className="pb-format-explanation">
                            {w("formatStbExplanation")}
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
                          {w(
                            setupStep === 2 && lookPath !== null
                              ? "backToLookOptions"
                              : "back",
                          )}
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
                          {w(
                            editorOpen ? "switchToTemplates" : "switchToCustom",
                          )}
                        </button>
                      )}
                    </div>
                    {(setupStep !== 2 || lookPath !== null) && (
                      <button
                        className="pb-button pb-form-submit"
                        type="submit"
                      >
                        {w(
                          setupStep === 1
                            ? "submitStepOne"
                            : setupStep === 2
                              ? editorOpen
                                ? "submitCustom"
                                : "submitStepTwo"
                              : "submitStepThree",
                        )}{" "}
                        <ArrowRight weight="bold" />
                      </button>
                    )}
                    <p className="pb-fine-print">{w("finePrint")}</p>
                  </footer>
                </form>
              ) : (
                <div className="pb-controls">
                  <p>{w.rich("playLead", richTags)}</p>
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
                        <small>{w("addPoint")}</small>
                      </button>
                    ))}
                  </div>
                  <div className="pb-control-actions">
                    <button
                      onClick={() => setHistory((prev) => prev.slice(0, -1))}
                      disabled={history.length < 2}
                    >
                      <ArrowUUpLeft /> {w("undoPoint")}
                    </button>
                    <button onClick={startPreview}>{w("resetMatch")}</button>
                  </div>
                  <p className="pb-match-status" role="status">
                    {state.winner
                      ? w("winnerNotice", {
                          team: names[state.winner === "a" ? 0 : 1],
                        })
                      : state.phase === "playing"
                        ? w("setNotice", {
                            number: state.sets.length,
                            rule: ruleText(getDeuceRule(config)),
                          })
                        : w("tiebreakNotice")}
                  </p>
                  {isStarPoint(state) && (
                    <p className="pb-star-callout" role="status">
                      {w("starPointNotice")}
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
                    <SlidersHorizontal /> {w("editBoard")}
                  </button>
                  <div className="pb-go-live">
                    <h3>{w("goLiveTitle")}</h3>
                    <p>
                      {w(
                        liveAvailable
                          ? workspace
                            ? "goLiveWorkspaceBody"
                            : "goLiveBody"
                          : "goLiveUnavailableBody",
                      )}
                    </p>
                    <button
                      className="pb-button pb-form-submit"
                      onClick={createLiveBoard}
                      disabled={!liveAvailable || creating}
                    >
                      {w(creating ? "goLiveSaving" : "goLiveSubmit")}
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
                {w("livePreview", {
                  style: (boardStyle === "custom"
                    ? boardStyleText("customName")
                    : getBoardStyle(boardStyle).name
                  ).toUpperCase(),
                })}
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
                <p className="pb-hand">{w.rich("previewScribble", richTags)}</p>
                <span className="pb-preview-caption">
                  {w(
                    stage === "setup"
                      ? "previewCaptionSetup"
                      : stage === "account"
                        ? "previewCaptionAccount"
                        : "previewCaptionPlay",
                  )}
                </span>
              </div>
            </aside>
          </div>
        </div>
      </dialog>
    </div>
  );
}
