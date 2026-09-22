"use client";
import { useRef, useState } from "react";
import { CheckCircle, UploadSimple } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("boardEditor");
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
        aria-label={t("logoFileAria")}
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
        aria-label={logo ? t("logoReplaceAria") : t("logoUploadAria")}
      >
        <span className="pb-logo-art" key={logo || "empty"}>
          {logo ? (
            <img src={logo} alt={t("logoPreviewAlt")} />
          ) : (
            <UploadSimple size={28} weight="bold" />
          )}
        </span>
        <span className="pb-logo-copy">
          <strong>
            {busy
              ? t("logoBusyTitle")
              : dragging
                ? t("logoDraggingTitle")
                : logo
                  ? t("logoReadyTitle")
                  : t("logoEmptyTitle")}
          </strong>
          <span>
            {busy
              ? t("logoBusySub")
              : filename || (logo ? t("logoReplaceSub") : t("logoEmptySub"))}
          </span>
          <small>{t("logoFormats")}</small>
        </span>
        {busy ? (
          <span className="pb-logo-spinner" aria-hidden="true" />
        ) : logo ? (
          <CheckCircle className="pb-logo-check" size={24} weight="fill" />
        ) : null}
      </button>
      <div className="pb-logo-status" role="status">
        {busy ? t("logoStatusBusy") : logo ? t("logoStatusReady") : ""}
      </div>
      {logo && (
        <button
          type="button"
          className="pb-logo-remove"
          disabled={locked}
          onClick={onRemove}
        >
          {t("logoRemove")}
        </button>
      )}
    </div>
  );
}
