"use client";
import { useEffect, useState } from "react";
import { browserSupabase } from "@/lib/supabase";
export function SignIn({
  matchId,
  onSuccess,
}: {
  matchId?: string;
  onSuccess?: () => void;
}) {
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
          redirectTo: `${location.origin}/auth/callback${matchId ? `?match=${matchId}` : ""}`,
        },
      });
      if (error) throw error;
    } catch {
      setError(
        "Google sign-in is not available yet. Please use an email code.",
      );
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
          throw new Error(
            "Please wait a minute before requesting another code.",
          );
        }
        throw new Error(
          "We couldn’t send your code. Check your email address and try again.",
        );
      }
      setToken("");
      setSent(true);
      setCooldown(60);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not send your code.",
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
          error.status === 429
            ? "Too many attempts. Wait a minute before trying again."
            : "That code is invalid or has expired. Use the newest email, or request a new code.",
        );
        return;
      }
      if (onSuccess) onSuccess();
      else
        location.assign(`/auth/callback${matchId ? `?match=${matchId}` : ""}`);
    } catch {
      setError(
        "We couldn’t verify your code. Check your connection and try again.",
      );
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
            title={
              googleEnabled
                ? undefined
                : "Google sign-in is being set up. Use email for now."
            }
            disabled={busy || !googleEnabled}
            onClick={() => void googleSignIn()}
          >
            <b aria-hidden="true">G</b> Continue with Google
            {!googleEnabled && " · soon"}
          </button>
          <span className="pbw-auth-divider">or use your email</span>
        </>
      )}
      {sent ? (
        <>
          <h2>Check your inbox.</h2>
          <p>
            Enter the 8-digit code sent to <strong>{email}</strong>. Stay on
            this page — no link to open.
          </p>
          <label>
            Email code
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
            {busy ? "Verifying…" : "Verify & open my board →"}
          </button>
          <div className="pbw-code-actions">
            <button
              type="button"
              className="pbw-secondary"
              disabled={busy || cooldown > 0}
              onClick={() => void sendCode()}
            >
              {cooldown ? `Resend in ${cooldown}s` : "Resend code"}
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
              Change email
            </button>
          </div>
        </>
      ) : (
        <>
          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourclub.com"
              disabled={busy}
            />
          </label>
          <button className="pbw-primary" disabled={busy || cooldown > 0}>
            {busy
              ? "Sending your code…"
              : cooldown
                ? `Try again in ${cooldown}s`
                : "Email me a sign-in code →"}
          </button>
          <p className="pbw-muted">
            No password. Enter your email code here and keep your board exactly
            as you made it.
          </p>
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
