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
import "./brand-generator.css";
import { LogoPicker } from "./LogoPicker";

export function BrandBoardGenerator({
  available,
  onApply,
}: {
  available: boolean;
  onApply: (result: GeneratedBoard) => void;
}) {
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
      setError("Choose a PNG, JPG or WebP image, up to 2 MB.");
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
      if (version === readVersion.current)
        setError("Could not read this image. Try another file.");
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
      if (!response.ok)
        throw new Error(
          data.error || "Could not generate a design. Please try again.",
        );
      setResult(data);
    } catch (err) {
      if (request.signal.aborted)
        setError("Design generation was stopped. You can try again.");
      else
        setError(
          err instanceof Error
            ? err.message
            : "Could not generate a design. Please try again.",
        );
    } finally {
      clearTimeout(timer);
      setBusy(false);
    }
  }
  return (
    <section className="pb-brand-generator" aria-label="Design from your brand">
      <div className="pb-brand-heading">
        <Sparkle weight="fill" />
        <div>
          <h3>A board with your DNA.</h3>
          <p>Bring your brand. We’ll find its match-day look.</p>
        </div>
      </div>
      {!result && (
        <>
          <div
            className="pb-brand-source"
            role="group"
            aria-label="Brand source"
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
              <Globe /> Website
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
              <UploadSimple /> Upload logo
            </button>
          </div>
          {kind === "website" ? (
            <label className="pb-brand-url">
              Your club or brand website
              <input
                type="text"
                inputMode="url"
                autoComplete="url"
                placeholder="yourclub.com"
                maxLength={2048}
                value={url}
                disabled={busy}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setResult(null);
                  setError("");
                }}
              />
              <small>
                We use public site content to suggest a brand-inspired look.
              </small>
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
            {kind === "website"
              ? "Public content and colors from your website are sent to OpenAI as design inspiration."
              : "Your logo is sent to OpenAI for design inspiration and included in your board."}
          </p>
          {!available && (
            <p className="pb-brand-unavailable" role="status">
              AI design isn’t connected in this preview yet. You can still use
              Fine-tune to create your own look.
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
              ? "Finding your match-day look…"
              : result
                ? "Generate another look"
                : "Generate my board"}
          </button>
          {busy && (
            <div className="pb-brand-progress" role="status">
              <span />
              Reading your brand and designing the board…
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
            Try another reference
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
              Inspired by{" "}
              {result.sources.map((source) => (
                <a key={source} href={source} target="_blank" rel="noreferrer">
                  {new URL(source).hostname}
                </a>
              ))}
            </div>
          )}
          <button
            className="pb-brand-generate"
            type="button"
            onClick={() => onApply(result)}
          >
            Use this look <ArrowRight />
          </button>
          <small>You can fine-tune every detail next.</small>
        </div>
      )}
    </section>
  );
}
