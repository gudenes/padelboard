"use client";
import { useEffect, useRef, useState } from "react";
import { prepareBoardLogo } from "@/lib/prepare-board-logo";
import {
  DEFAULT_CUSTOM_DESIGN,
  resolveCustomDesign,
  type CustomBoardDesign,
} from "@/lib/custom-board";
import { useTranslations } from "next-intl";
import "./editor.css";
import { LogoPicker } from "./LogoPicker";

/** Mantém a interpolação crua do número, como antes da extração de texto. */
const px = (value?: number) => String(value ?? "");

const COLOR_FIELDS = [
  "background",
  "rowBackground",
  "textColor",
  "scoreBackground",
  "scoreTextColor",
  "pointTextColor",
  "borderColor",
] as const;

export function CustomBoardEditor({
  design: input,
  accent,
  onChange,
  onAccentChange,
}: {
  design?: Partial<CustomBoardDesign>;
  accent: string;
  onChange: (design: CustomBoardDesign) => void;
  onAccentChange: (color: string) => void;
}) {
  const t = useTranslations("boardEditor");
  const [panel, setPanel] = useState<"colors" | "layout" | "brand">("colors");
  const [logoError, setLogoError] = useState("");
  const [readingLogo, setReadingLogo] = useState(false);
  const latest = useRef({ input, onChange });
  latest.current = { input, onChange };
  const logoVersion = useRef(0);
  useEffect(
    () => () => {
      logoVersion.current++;
    },
    [],
  );
  const design = resolveCustomDesign(input);
  function update(patch: Partial<CustomBoardDesign>) {
    onChange({ ...design, ...patch });
  }
  return (
    <section className="board-editor" aria-label={t("customSectionAria")}>
      <div className="board-editor-heading">
        <div>
          <h3>{t("customTitle")}</h3>
          <p>{t("customLead")}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            logoVersion.current++;
            setReadingLogo(false);
            onChange({ ...DEFAULT_CUSTOM_DESIGN });
            onAccentChange("#f5ff36");
          }}
        >
          {t("reset")}
        </button>
      </div>
      <div
        className="board-editor-tabs"
        role="group"
        aria-label={t("tabsAria")}
      >
        <button
          type="button"
          aria-pressed={panel === "colors"}
          onClick={() => setPanel("colors")}
        >
          {t("tabColors")}
        </button>
        <button
          type="button"
          aria-pressed={panel === "brand"}
          onClick={() => setPanel("brand")}
        >
          {t("tabBrand")}
        </button>
        <button
          type="button"
          aria-pressed={panel === "layout"}
          onClick={() => setPanel("layout")}
        >
          {t("tabLayout")}
        </button>
      </div>
      {panel === "colors" && (
        <fieldset>
          <legend>{t("colorsLegend")}</legend>
          <div className="board-editor-colors">
            {COLOR_FIELDS.map((key) => (
              <ColorField
                key={key}
                label={t(`colors.${key}`)}
                value={design[key]}
                onChange={(color) => update({ [key]: color })}
              />
            ))}
            <ColorField
              label={t("accentLabel")}
              value={accent}
              onChange={onAccentChange}
            />
          </div>
          <p className="board-editor-hint">{t("colorsHint")}</p>
        </fieldset>
      )}
      {panel === "brand" && (
        <div className="board-editor-brand">
          <label className="board-editor-checkbox">
            <input
              type="checkbox"
              checked={design.showHeader}
              onChange={(event) => update({ showHeader: event.target.checked })}
            />
            {t("showHeader")}
          </label>
          <label className="board-editor-checkbox">
            <input
              type="checkbox"
              checked={design.showLogo}
              disabled={!design.showHeader}
              onChange={(e) => update({ showLogo: e.target.checked })}
            />{" "}
            {t("showLogo")}
          </label>
          <LogoPicker
            logo={design.logo || ""}
            busy={readingLogo}
            onSelect={async (file) => {
              const version = ++logoVersion.current;
              setReadingLogo(true);
              setLogoError("");
              try {
                const logo = await prepareBoardLogo(file);
                if (version === logoVersion.current)
                  latest.current.onChange({
                    ...resolveCustomDesign(latest.current.input),
                    logo,
                    showLogo: true,
                  });
              } catch (err) {
                if (version === logoVersion.current)
                  setLogoError(
                    err instanceof Error ? err.message : t("customLogoError"),
                  );
              } finally {
                if (version === logoVersion.current) setReadingLogo(false);
              }
            }}
            onRemove={() => {
              logoVersion.current++;
              setReadingLogo(false);
              setLogoError("");
              update({ logo: "", logoText: "PADELBOARD" });
            }}
          />
          <label className="board-editor-select">
            {t("brandNameLabel")}
            <input
              type="text"
              maxLength={40}
              value={design.logoText}
              onChange={(e) => update({ logoText: e.target.value })}
            />
          </label>
          <label className="board-editor-range">
            <span>
              {t("logoSizeLabel")}
              <output>{t("pxValue", { value: px(design.logoHeight) })}</output>
            </span>
            <input
              type="range"
              aria-label={t("logoSizeLabel")}
              min={14}
              max={36}
              value={design.logoHeight}
              onChange={(e) => update({ logoHeight: Number(e.target.value) })}
            />
          </label>
          {logoError && (
            <p role="alert" className="board-editor-hint">
              {logoError}
            </p>
          )}
        </div>
      )}
      {panel === "layout" && (
        <>
          <label className="board-editor-select">
            {t("typographyLabel")}
            <select
              value={design.font}
              onChange={(event) =>
                update({
                  font: event.target.value as CustomBoardDesign["font"],
                })
              }
            >
              <option value="sans">{t("fontSans")}</option>
              <option value="serif">{t("fontSerif")}</option>
              <option value="mono">{t("fontMono")}</option>
            </select>
          </label>
          <fieldset>
            <legend>{t("layoutLegend")}</legend>
            {(
              [
                { key: "rowHeight", min: 28, max: 64 },
                { key: "fontSize", min: 12, max: 24 },
                {
                  key: "scoreSize",
                  min: 14,
                  max: Math.min(32, design.rowHeight - 6),
                },
                { key: "radius", min: 0, max: 20 },
                { key: "width", min: 320, max: 720 },
              ] as const
            ).map(({ key, min, max }) => (
              <label className="board-editor-range" key={key}>
                <span>
                  {t(`layout.${key}`)}
                  <output>{t("pxValue", { value: px(design[key]) })}</output>
                </span>
                <input
                  aria-label={t(`layout.${key}`)}
                  type="range"
                  min={min}
                  max={max}
                  value={design[key]}
                  onChange={(event) =>
                    update({ [key]: Number(event.target.value) })
                  }
                />
              </label>
            ))}
          </fieldset>
        </>
      )}
    </section>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useTranslations("boardEditor");
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <div className="board-editor-color">
      <input
        type="color"
        aria-label={t("colorSwatchAria", { label })}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <label>
        <span>{label}</span>
        <input
          aria-label={t("colorHexAria", { label })}
          type="text"
          spellCheck={false}
          value={text}
          pattern="#[0-9a-fA-F]{6}"
          maxLength={7}
          title={t("hexHint", { example: "#173f37" })}
          onChange={(event) => {
            setText(event.target.value);
            if (/^#[0-9a-f]{6}$/i.test(event.target.value))
              onChange(event.target.value);
          }}
          onBlur={() => {
            if (!/^#[0-9a-f]{6}$/i.test(text)) setText(value);
          }}
        />
      </label>
    </div>
  );
}
