"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { MatchRow } from "@/types/match";
type Destination = "studio" | "obs";
export function AddToScreen({ row }: { row: MatchRow }) {
  const t = useTranslations("workspace");
  const router = useRouter(),
    dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<Destination | null>(null),
    [remember, setRemember] = useState(false),
    [copied, setCopied] = useState(false),
    [error, setError] = useState("");
  const key = `padelboard:screen-destination:${row.owner_id}`;
  function open(force = false) {
    let saved: Destination | null = null;
    try {
      const value = localStorage.getItem(key);
      if (value === "studio" || value === "obs") saved = value;
    } catch {}
    setRemember(!!saved);
    setCopied(false);
    setError("");
    if (saved === "studio" && !force) {
      router.push(`/m/${row.short_code}/studio`);
      return;
    }
    setSelected(!force && saved === "obs" ? "obs" : null);
    dialog.current?.showModal();
  }
  function choose(value: Destination) {
    try {
      if (remember) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
    } catch {
      setError(t("screenStorageError"));
    }
    if (value === "studio") {
      dialog.current?.close();
      router.push(`/m/${row.short_code}/studio`);
    } else setSelected("obs");
  }
  function rememberChoice(value: boolean) {
    setRemember(value);
    if (!value)
      try {
        localStorage.removeItem(key);
      } catch {}
    else if (selected)
      try {
        localStorage.setItem(key, selected);
      } catch {
        setError(t("screenStorageError"));
      }
  }
  return (
    <section className="pbw-card">
      <span className="pbw-eyebrow">{t("screenEyebrow")}</span>
      <h2>{t("screenTitle")}</h2>
      <p>{t("screenLead")}</p>
      <button className="pbw-primary" onClick={() => open()}>
        {t("screenCta")}
      </button>
      <button
        className="pbw-text-link pbw-link-button"
        onClick={() => open(true)}
      >
        {t("screenChangeDestination")}
      </button>
      <dialog
        ref={dialog}
        className="pbw-destination"
        aria-labelledby="screen-title"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current.close();
        }}
      >
        <button
          className="pbw-secondary pbw-destination-close"
          aria-label={t("screenCloseAria")}
          onClick={() => dialog.current?.close()}
        >
          ×
        </button>
        <span className="pbw-hand">{t("screenHand")}</span>
        <h2 id="screen-title">
          {selected === "obs" ? t("screenObsTitle") : t("screenChooseTitle")}
        </h2>
        {selected === "obs" ? (
          <>
            <p>
              {t.rich("screenObsBody", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
            <label>
              {t("screenOverlayUrlLabel")}
              <input
                readOnly
                value={
                  typeof window === "undefined"
                    ? ""
                    : `${window.location.origin}/overlay/${row.short_code}`
                }
                onFocus={(e) => e.target.select()}
              />
            </label>
            <button
              className="pbw-primary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    `${location.origin}/overlay/${row.short_code}`,
                  );
                  setCopied(true);
                } catch {
                  setError(t("screenCopyError"));
                }
              }}
            >
              {copied ? t("screenCopied") : t("screenCopyLink")}
            </button>
            <a
              className="pbw-text-link"
              href={`/overlay/${row.short_code}`}
              target="_blank"
              rel="noreferrer"
            >
              {t("screenOpenPreview")}
            </a>
            <button className="pbw-secondary" onClick={() => setSelected(null)}>
              {t("screenChooseAnother")}
            </button>
          </>
        ) : (
          <div className="pbw-destination-options">
            <button onClick={() => choose("studio")}>
              <span>🎥</span>
              <strong>{t("screenStudioName")}</strong>
              <p>{t("screenStudioBody")}</p>
              <b>{t("screenStudioCta")}</b>
            </button>
            <button onClick={() => choose("obs")}>
              <span>▣</span>
              <strong>{t("screenObsName")}</strong>
              <p>{t("screenObsOptionBody")}</p>
              <b>{t("screenObsCta")}</b>
            </button>
          </div>
        )}
        <label className="pbw-toggle">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => rememberChoice(e.target.checked)}
          />
          {t("screenRememberChoice")}
        </label>
        {error && (
          <p className="pbw-error" role="alert">
            {error}
          </p>
        )}
      </dialog>
    </section>
  );
}
