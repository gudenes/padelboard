"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { MatchRow } from "@/types/match";
type Destination = "studio" | "obs";
export function AddToScreen({ row }: { row: MatchRow }) {
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
      setError("Your browser could not remember this preference.");
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
        setError("Your browser could not remember this preference.");
      }
  }
  return (
    <section className="pbw-card">
      <span className="pbw-eyebrow">READY FOR THE BIG SCREEN?</span>
      <h2>Put your match on screen.</h2>
      <p>Use your camera in Padelboard Studio or add an overlay to OBS.</p>
      <button className="pbw-primary" onClick={() => open()}>
        Add to screen ↗
      </button>
      <button
        className="pbw-text-link pbw-link-button"
        onClick={() => open(true)}
      >
        Choose or change destination
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
          aria-label="Close screen options"
          onClick={() => dialog.current?.close()}
        >
          ×
        </button>
        <span className="pbw-hand">LET’S PUT ON A SHOW.</span>
        <h2 id="screen-title">
          {selected === "obs"
            ? "Your OBS overlay. Ready."
            : "Where are we playing?"}
        </h2>
        {selected === "obs" ? (
          <>
            <p>
              In OBS, add a <strong>Browser Source</strong> and paste this URL.
              Set the source to 1920 × 1080; the background is transparent.
            </p>
            <label>
              Overlay URL
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
                  setError("Select and copy the URL above.");
                }
              }}
            >
              {copied ? "✓ Link copied" : "Copy overlay link ↗"}
            </button>
            <a
              className="pbw-text-link"
              href={`/overlay/${row.short_code}`}
              target="_blank"
              rel="noreferrer"
            >
              Open overlay preview ↗
            </a>
            <button className="pbw-secondary" onClick={() => setSelected(null)}>
              ← Choose another option
            </button>
          </>
        ) : (
          <div className="pbw-destination-options">
            <button onClick={() => choose("studio")}>
              <span>🎥</span>
              <strong>Padelboard Studio</strong>
              <p>
                Camera + live scoreboard in your browser. Share your tab. No OBS
                needed.
              </p>
              <b>Open studio →</b>
            </button>
            <button onClick={() => choose("obs")}>
              <span>▣</span>
              <strong>Overlay for OBS</strong>
              <p>A transparent scoreboard for your existing broadcast setup.</p>
              <b>Get overlay link →</b>
            </button>
          </div>
        )}
        <label className="pbw-toggle">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => rememberChoice(e.target.checked)}
          />
          Remember my choice on this browser
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
