"use client";
import { useEffect, useRef, useState } from "react";
import { prepareBoardLogo } from "@/lib/prepare-board-logo";
import {
  DEFAULT_CUSTOM_DESIGN,
  resolveCustomDesign,
  type CustomBoardDesign,
} from "@/lib/custom-board";
import "./editor.css";
import { LogoPicker } from "./LogoPicker";

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
    <section className="board-editor" aria-label="Custom board editor">
      <div className="board-editor-heading">
        <div>
          <h3>Your board, your way.</h3>
          <p>Every change appears in the preview.</p>
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
          Reset
        </button>
      </div>
      <div
        className="board-editor-tabs"
        role="group"
        aria-label="Editor section"
      >
        <button
          type="button"
          aria-pressed={panel === "colors"}
          onClick={() => setPanel("colors")}
        >
          Colors
        </button>
        <button
          type="button"
          aria-pressed={panel === "brand"}
          onClick={() => setPanel("brand")}
        >
          Logo & header
        </button>
        <button
          type="button"
          aria-pressed={panel === "layout"}
          onClick={() => setPanel("layout")}
        >
          Typography & layout
        </button>
      </div>
      {panel === "colors" && (
        <fieldset>
          <legend>Colors</legend>
          <div className="board-editor-colors">
            {(
              [
                { key: "background", label: "Board" },
                { key: "rowBackground", label: "Player rows" },
                { key: "textColor", label: "Names" },
                { key: "scoreBackground", label: "Set cells" },
                { key: "scoreTextColor", label: "Set numbers" },
                { key: "pointTextColor", label: "Point numbers" },
                { key: "borderColor", label: "Borders" },
              ] as const
            ).map(({ key, label }) => (
              <ColorField
                key={key}
                label={label}
                value={design[key]}
                onChange={(color) => update({ [key]: color })}
              />
            ))}
            <ColorField
              label="Points accent"
              value={accent}
              onChange={onAccentChange}
            />
          </div>
          <p className="board-editor-hint">
            Point backgrounds stay distinct from sets and player rows
            automatically.
          </p>
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
            Show first row (logo & match title)
          </label>
          <label className="board-editor-checkbox">
            <input
              type="checkbox"
              checked={design.showLogo}
              disabled={!design.showHeader}
              onChange={(e) => update({ showLogo: e.target.checked })}
            />{" "}
            Show logo
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
                    err instanceof Error ? err.message : "Could not read logo.",
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
            Brand name
            <input
              type="text"
              maxLength={40}
              value={design.logoText}
              onChange={(e) => update({ logoText: e.target.value })}
            />
          </label>
          <label className="board-editor-range">
            <span>
              Logo size<output>{design.logoHeight} px</output>
            </span>
            <input
              type="range"
              aria-label="Logo size"
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
            Typography
            <select
              value={design.font}
              onChange={(event) =>
                update({
                  font: event.target.value as CustomBoardDesign["font"],
                })
              }
            >
              <option value="sans">Modern sans</option>
              <option value="serif">Classic serif</option>
              <option value="mono">Monospace</option>
            </select>
          </label>
          <fieldset>
            <legend>Layout</legend>
            {(
              [
                { key: "rowHeight", label: "Row height", min: 28, max: 64 },
                { key: "fontSize", label: "Name size", min: 12, max: 24 },
                {
                  key: "scoreSize",
                  label: "Score size",
                  min: 14,
                  max: Math.min(32, design.rowHeight - 6),
                },
                { key: "radius", label: "Corner radius", min: 0, max: 20 },
                { key: "width", label: "Overlay width", min: 320, max: 720 },
              ] as const
            ).map(({ key, label, min, max }) => (
              <label className="board-editor-range" key={key}>
                <span>
                  {label}
                  <output>{design[key]} px</output>
                </span>
                <input
                  aria-label={label}
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
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <div className="board-editor-color">
      <input
        type="color"
        aria-label={`${label} color`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <label>
        <span>{label}</span>
        <input
          aria-label={`${label} hex`}
          type="text"
          spellCheck={false}
          value={text}
          pattern="#[0-9a-fA-F]{6}"
          maxLength={7}
          title="Use a six-digit hex color, such as #173f37"
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
