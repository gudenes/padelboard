"use client";
import { useEffect, useRef, useState } from "react";
import {
  Globe,
  UploadSimple,
  Sparkle,
  ArrowRight,
} from "@phosphor-icons/react";
import type { GeneratedBoard } from "@/lib/ai-board-design";
import { prepareBoardLogo } from "@/lib/prepare-board-logo";
import { TourScoreboard } from "./TourScoreboard";
import { createInitialState } from "@/lib/padel-scoring";
import { defaultConfig } from "@/types/match";
import { useTranslations } from "next-intl";
import "./brand-generator.css";
import { LogoPicker } from "./LogoPicker";

export function BrandBoardGenerator({
  available,
  onApply,
}: {
  available: boolean;
  onApply: (result: GeneratedBoard) => void;
}) {
  const t = useTranslations("boardEditor");
  const w = useTranslations("wizard");
  const [kind, setKind] = useState<"website" | "logo">("website");
  const [url, setUrl] = useState("");
  const [logo, setLogo] = useState("");
  const [filename, setFilename] = useState("");
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GeneratedBoard | null>(null);
  const controller = useRef<AbortController | null>(null);
  const readVersion = useRef(0);
  useEffect(
    () => () => {
      controller.current?.abort();
      readVersion.current++;
    },
    [],
  );
  async function chooseLogo(file?: File) {
    const version = ++readVersion.current;
    setError("");
    setResult(null);
    setLogo("");
    setFilename("");
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setError(t("aiLogoTypeError"));
      return;
    }
    setReading(true);
    try {
      const data = await prepareBoardLogo(file);
      if (version === readVersion.current) {
        setLogo(data);
        setFilename(file.name);
      }
    } catch {
      if (version === readVersion.current) setError(t("aiLogoReadError"));
    } finally {
      if (version === readVersion.current) setReading(false);
    }
  }
  async function generate() {
    if (busy || !available) return;
    setError("");
    setResult(null);
    setBusy(true);
    const request = new AbortController();
    controller.current = request;
    const timer = setTimeout(() => request.abort(), 85_000);
    try {
      const response = await fetch("/api/board-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: request.signal,
        body: JSON.stringify(
          kind === "website" ? { kind, url } : { kind, image: logo },
        ),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("aiGenerateError"));
      setResult(data);
    } catch (err) {
      if (request.signal.aborted) setError(t("aiAbortedError"));
      else setError(err instanceof Error ? err.message : t("aiGenerateError"));
    } finally {
      clearTimeout(timer);
      setBusy(false);
    }
  }
  return (
    <section className="pb-brand-generator" aria-label={t("aiSectionAria")}>
      <div className="pb-brand-heading">
        <Sparkle weight="fill" />
        <div>
          <h3>{t("aiTitle")}</h3>
          <p>{t("aiLead")}</p>
        </div>
      </div>
      {!result && (
        <>
          <div
            className="pb-brand-source"
            role="group"
            aria-label={t("aiSourceAria")}
          >
            <button
              type="button"
              aria-pressed={kind === "website"}
              disabled={busy}
              onClick={() => {
                setKind("website");
                setResult(null);
                setError("");
              }}
            >
              <Globe /> {t("aiSourceWebsite")}
            </button>
            <button
              type="button"
              aria-pressed={kind === "logo"}
              disabled={busy}
              onClick={() => {
                setKind("logo");
                setResult(null);
                setError("");
              }}
            >
              <UploadSimple /> {t("aiSourceLogo")}
            </button>
          </div>
          {kind === "website" ? (
            <label className="pb-brand-url">
              {t("aiUrlLabel")}
              <input
                type="text"
                inputMode="url"
                autoComplete="url"
                placeholder={t("aiUrlPlaceholder")}
                maxLength={2048}
                value={url}
                disabled={busy}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setResult(null);
                  setError("");
                }}
              />
              <small>{t("aiUrlHint")}</small>
            </label>
          ) : (
            <LogoPicker
              logo={logo}
              filename={filename}
              busy={reading}
              disabled={busy}
              onSelect={(file) => void chooseLogo(file)}
              onRemove={() => {
                readVersion.current++;
                setReading(false);
                setLogo("");
                setFilename("");
                setResult(null);
                setError("");
              }}
            />
          )}
          <p className="pb-brand-notice">
            {kind === "website" ? t("aiNoticeWebsite") : t("aiNoticeLogo")}
          </p>
          {!available && (
            <p className="pb-brand-unavailable" role="status">
              {t("aiUnavailable", { mode: w("editorModeManual") })}
            </p>
          )}
          <button
            className={`pb-brand-generate${busy ? " is-generating" : ""}`}
            aria-busy={busy}
            type="button"
            disabled={
              !available ||
              busy ||
              reading ||
              (kind === "website" ? !url.trim() : !logo)
            }
            onClick={() => void generate()}
          >
            {busy ? (
              <span className="pb-brand-spinner" aria-hidden="true" />
            ) : (
              <Sparkle weight="fill" />
            )}
            {busy
              ? t("aiGenerating")
              : result
                ? t("aiGenerateAnother")
                : t("aiGenerate")}
          </button>
          {busy && (
            <div className="pb-brand-progress" role="status">
              <span />
              {t("aiProgress")}
            </div>
          )}
          {error && (
            <p className="pb-brand-error" role="alert">
              {error}
            </p>
          )}
        </>
      )}
      {result && (
        <div className="pb-brand-result" aria-live="polite">
          <button
            type="button"
            className="pb-edit-link"
            onClick={() => setResult(null)}
          >
            {t("aiTryAnother")}
          </button>
          <h4>{result.name}</h4>
          <p>{result.reasoning}</p>
          <TourScoreboard
            names={["Galán / Chingotto", "Coello / Tapia"]}
            players={["Galán", "Chingotto", "Coello", "Tapia"]}
            variant="custom"
            customDesign={result.design}
            accent={result.accent}
            state={createInitialState(defaultConfig())}
            title="YOUR MATCH"
          />
          {result.sources.length > 0 && (
            <div className="pb-brand-sources">
              {t.rich("aiInspiredBy", {
                sources: () => (
                  <>
                    {result.sources.map((source) => (
                      <a
                        key={source}
                        href={source}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {new URL(source).hostname}
                      </a>
                    ))}
                  </>
                ),
              })}
            </div>
          )}
          <button
            className="pb-brand-generate"
            type="button"
            onClick={() => onApply(result)}
          >
            {t("aiUseLook")} <ArrowRight />
          </button>
          <small>{t("aiFineTuneNext")}</small>
        </div>
      )}
    </section>
  );
}
