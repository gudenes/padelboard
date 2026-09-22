"use client";
import { useEffect, useState } from "react";
import { browserSupabase } from "@/lib/supabase";
import { useTranslations } from "next-intl";
export function SignIn({
  matchId,
  onSuccess,
  remote = false,
}: {
  matchId?: string;
  remote?: boolean;
  onSuccess?: () => void;
}) {
  const t = useTranslations("account");
  const [googleEnabled, setGoogleEnabled] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => setGoogleEnabled(data.external?.google === true))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [cooldown]);
  async function googleSignIn() {
    setBusy(true);
    setError("");
    try {
      const { error } = await browserSupabase().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${location.origin}/auth/callback${matchId ? `?match=${matchId}${remote ? "&mode=remote" : ""}` : ""}`,
        },
      });
      if (error) throw error;
    } catch {
      setError(t("googleUnavailable"));
      setBusy(false);
    }
  }
  async function sendCode() {
    if (busy || cooldown) return;
    setBusy(true);
    setError("");
    try {
      if (matchId)
        document.cookie = `padelboard_pending_match=${encodeURIComponent(matchId)}; Path=/; Max-Age=3600; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      const { error } = await browserSupabase().auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      });
      if (error) {
        if (error.status === 429) {
          setCooldown(60);
          throw new Error(t("codeCooldown"));
        }
        throw new Error(t("codeSendFailed"));
      }
      setToken("");
      setSent(true);
      setCooldown(60);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : t("codeSendFailedGeneric"),
      );
    } finally {
      setBusy(false);
    }
  }
  async function verifyCode() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const { error } = await browserSupabase().auth.verifyOtp({
        email: email.trim(),
        token,
        type: "email",
      });
      if (error) {
        setError(
          error.status === 429 ? t("codeTooManyAttempts") : t("codeInvalid"),
        );
        return;
      }
      if (onSuccess) onSuccess();
      else
        location.assign(
          `/auth/callback${matchId ? `?match=${matchId}${remote ? "&mode=remote" : ""}` : ""}`,
        );
    } catch {
      setError(t("codeVerifyFailed"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className="pbw-login"
      onSubmit={(e) => {
        e.preventDefault();
        void (sent ? verifyCode() : sendCode());
      }}
    >
      {!sent && (
        <>
          <button
            type="button"
            className="pbw-google"
            title={googleEnabled ? undefined : t("googleSoonTitle")}
            disabled={busy || !googleEnabled}
            onClick={() => void googleSignIn()}
          >
            <b aria-hidden="true">G</b> {t("googleContinue")}
            {!googleEnabled && ` · ${t("googleSoon")}`}
          </button>
          <span className="pbw-auth-divider">{t("emailDivider")}</span>
        </>
      )}
      {sent ? (
        <>
          <h2>{t("codeSentTitle")}</h2>
          <p>
            {t.rich("codeSentLead", {
              email: () => <strong>{email}</strong>,
            })}
          </p>
          <label>
            {t("codeLabel")}
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{8}"
              maxLength={8}
              required
              autoFocus
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
              placeholder="00000000"
              disabled={busy}
            />
          </label>
          <button className="pbw-primary" disabled={busy || token.length !== 8}>
            {busy ? t("verifying") : `${t("verifyCta")} →`}
          </button>
          <div className="pbw-code-actions">
            <button
              type="button"
              className="pbw-secondary"
              disabled={busy || cooldown > 0}
              onClick={() => void sendCode()}
            >
              {cooldown ? t("resendIn", { seconds: cooldown }) : t("resend")}
            </button>
            <button
              type="button"
              className="pbw-secondary"
              disabled={busy}
              onClick={() => {
                setSent(false);
                setToken("");
                setError("");
              }}
            >
              {t("changeEmail")}
            </button>
          </div>
        </>
      ) : (
        <>
          <label>
            {t("emailLabel")}
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              disabled={busy}
            />
          </label>
          <button className="pbw-primary" disabled={busy || cooldown > 0}>
            {busy
              ? t("sendingCode")
              : cooldown
                ? t("retryIn", { seconds: cooldown })
                : `${t("sendCodeCta")} →`}
          </button>
          <p className="pbw-muted">{t("noPassword")}</p>
        </>
      )}
      {error && (
        <p className="pbw-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
