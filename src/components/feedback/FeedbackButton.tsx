"use client";
import { useEffect, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { browserSupabase } from "@/lib/supabase";
import "./feedback.css";
export function FeedbackButton() {
  const t = useTranslations("common");
  const fmt = useFormatter();
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
        throw new Error(data.error || t("feedbackErrorSend"));
      }
      setSent(true);
      setMessage("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t("feedbackErrorRetry"),
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
        <span aria-hidden="true">✎</span> {t("feedbackTrigger")}
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
          aria-label={t("feedbackCloseAria")}
          onClick={() => dialog.current?.close()}
        >
          ×
        </button>
        {sent ? (
          <div className="pbf-success" role="status">
            <span aria-hidden="true">✳</span>
            <h2 id="feedback-title">{t("feedbackThanksTitle")}</h2>
            <p>{t("feedbackThanksBody")}</p>
            <button
              className="pbf-submit"
              onClick={() => dialog.current?.close()}
            >
              {t("feedbackBackToGame")} →
            </button>
          </div>
        ) : (
          <form onSubmit={send}>
            <span className="pbf-eyebrow">{t("feedbackEyebrow")}</span>
            <h2 id="feedback-title">{t("feedbackTitle")}</h2>
            <p>{t("feedbackLead")}</p>
            <label htmlFor="feedback-category">
              {t("feedbackCategoryLabel")}
            </label>
            <select
              id="feedback-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={busy}
            >
              <option value="idea">{t("feedbackCategoryIdea")}</option>
              <option value="problem">{t("feedbackCategoryProblem")}</option>
              <option value="other">{t("feedbackCategoryOther")}</option>
            </select>
            <label htmlFor="feedback-message">
              {t("feedbackMessageLabel")}
            </label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              minLength={10}
              maxLength={2000}
              required
              rows={5}
              disabled={busy}
              placeholder={t("feedbackPlaceholder")}
              aria-describedby="feedback-note"
            />
            <small id="feedback-note">
              {t("feedbackCounter", {
                count: fmt.number(message.length),
                max: fmt.number(2000),
              })}
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
                  <span className="pbf-spinner" aria-hidden="true" />{" "}
                  {t("feedbackSending")}
                </>
              ) : (
                `${t("feedbackSubmit")} →`
              )}
            </button>
          </form>
        )}
      </dialog>
    </div>
  );
}
