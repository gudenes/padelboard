"use client";
import { useRef, useState } from "react";
import { CheckCircle, UploadSimple } from "@phosphor-icons/react";
import "./logo-picker.css";

export function LogoPicker({
  logo,
  filename,
  busy,
  disabled = false,
  onSelect,
  onRemove,
}: {
  logo: string;
  filename?: string;
  busy: boolean;
  disabled?: boolean;
  onSelect: (file: File) => void;
  onRemove: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const depth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const locked = disabled || busy;
  return (
    <div
      className={`pb-logo-picker${dragging ? " is-dragging" : ""}${busy ? " is-reading" : ""}${logo ? " has-logo" : ""}`}
      aria-busy={busy}
      onDragEnter={(e) => {
        e.preventDefault();
        if (!locked && e.dataTransfer.types.includes("Files")) {
          depth.current++;
          setDragging(true);
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = locked ? "none" : "copy";
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        depth.current = Math.max(0, depth.current - 1);
        if (!depth.current) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        depth.current = 0;
        setDragging(false);
        if (!locked && e.dataTransfer.files[0])
          onSelect(e.dataTransfer.files[0]);
      }}
    >
      <input
        ref={input}
        hidden
        type="file"
        accept="image/png,image/jpeg,image/webp"
        aria-label="Choose logo file"
        disabled={locked}
        tabIndex={-1}
        onChange={(e) => {
          const file = e.currentTarget.files?.[0];
          e.currentTarget.value = "";
          if (file) onSelect(file);
        }}
      />
      <button
        type="button"
        className="pb-logo-drop"
        disabled={locked}
        onClick={() => input.current?.click()}
        aria-label={logo ? "Replace logo" : "Upload your logo"}
      >
        <span className="pb-logo-art" key={logo || "empty"}>
          {logo ? (
            <img src={logo} alt="Your logo preview" />
          ) : (
            <UploadSimple size={28} weight="bold" />
          )}
        </span>
        <span className="pb-logo-copy">
          <strong>
            {busy
              ? "Getting your logo ready…"
              : dragging
                ? "Drop it. Make it yours."
                : logo
                  ? "Looking like you."
                  : "Drop your logo here."}
          </strong>
          <span>
            {busy
              ? "Preparing a crisp preview"
              : filename ||
                (logo
                  ? "Click to replace your logo"
                  : "or click to choose a file")}
          </span>
          <small>PNG, JPG or WebP · up to 2 MB</small>
        </span>
        {busy ? (
          <span className="pb-logo-spinner" aria-hidden="true" />
        ) : logo ? (
          <CheckCircle className="pb-logo-check" size={24} weight="fill" />
        ) : null}
      </button>
      <div className="pb-logo-status" role="status">
        {busy ? "Preparing logo…" : logo ? "Logo ready" : ""}
      </div>
      {logo && (
        <button
          type="button"
          className="pb-logo-remove"
          disabled={locked}
          onClick={onRemove}
        >
          Remove logo
        </button>
      )}
    </div>
  );
}
