"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { browserSupabase } from "@/lib/supabase";
import "./feedback.css";
export function FeedbackButton() {
  const path = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const [signedIn, setSignedIn] = useState(false),
    [message, setMessage] = useState(""),
    [category, setCategory] = useState("idea"),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    const sb = browserSupabase();
    let alive = true;
    void sb.auth.getUser().then(({ data }) => {
      if (alive) setSignedIn(!!data.user);
    });
    const { data } = sb.auth.onAuthStateChange((_event, session) =>
      setSignedIn(!!session),
    );
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    dialog.current?.close();
  }, [path]);
  if (!signedIn || path.startsWith("/overlay/") || path.endsWith("/remote"))
    return null;
  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message, page_path: path }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Couldn’t send feedback.");
      }
      setSent(true);
      setMessage("");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Couldn’t send feedback. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="pbf">
      <button
        className="pbf-trigger"
        onClick={() => {
          setSent(false);
          setError("");
          dialog.current?.showModal();
        }}
        aria-haspopup="dialog"
      >
        <span aria-hidden="true">✎</span> Feedback
      </button>
      <dialog
        ref={dialog}
        className="pbf-dialog"
        aria-labelledby="feedback-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        <button
          className="pbf-close"
          aria-label="Close feedback"
          onClick={() => dialog.current?.close()}
        >
          ×
        </button>
        {sent ? (
          <div className="pbf-success" role="status">
            <span aria-hidden="true">✳</span>
            <h2 id="feedback-title">You’ve made your point!</h2>
            <p>
              Thanks for helping make Padelboard better. Your feedback has been
              saved.
            </p>
            <button
              className="pbf-submit"
              onClick={() => dialog.current?.close()}
            >
              Back to the game →
            </button>
          </div>
        ) : (
          <form onSubmit={send}>
            <span className="pbf-eyebrow">YOUR COURT. YOUR SAY.</span>
            <h2 id="feedback-title">Help us up our game.</h2>
            <p>An idea, a hiccup, or something you love? We’re listening.</p>
            <label htmlFor="feedback-category">What’s on your mind?</label>
            <select
              id="feedback-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={busy}
            >
              <option value="idea">An idea or suggestion</option>
              <option value="problem">Something isn’t working</option>
              <option value="other">Something else</option>
            </select>
            <label htmlFor="feedback-message">Your feedback</label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              minLength={10}
              maxLength={2000}
              required
              rows={5}
              disabled={busy}
              placeholder="Tell us a little more…"
              aria-describedby="feedback-note"
            />
            <small id="feedback-note">
              {message.length}/2,000 · Your account and current page are
              included. Please don’t include passwords or sensitive information.
            </small>
            {error && (
              <p className="pbf-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="pbf-submit"
              disabled={busy || message.trim().length < 10}
            >
              {busy ? (
                <>
                  <span className="pbf-spinner" aria-hidden="true" /> Sending…
                </>
              ) : (
                "Send feedback →"
              )}
            </button>
          </form>
        )}
      </dialog>
    </div>
  );
}
