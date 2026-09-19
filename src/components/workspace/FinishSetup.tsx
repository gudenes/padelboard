"use client";
import { useEffect, useState } from "react";
import { browserSupabase } from "@/lib/supabase";
import { getDraftToken, clearDraftToken } from "@/lib/draft-token";
import { AVATAR_COLORS, AVATAR_STYLES } from "@/lib/player-profile";
import { SignIn } from "./SignIn";
import { PlayerAvatar } from "./PlayerAvatar";
import "./workspace.css";
export function FinishSetup({
  matchId,
  shortCode,
  claimDraft = true,
  editProfile = false,
}: {
  matchId?: string;
  shortCode?: string;
  claimDraft?: boolean;
  editProfile?: boolean;
}) {
  const [phase, setPhase] = useState<"loading" | "login" | "profile" | "ready">(
    "loading",
  );
  const [name, setName] = useState(""),
    [role, setRole] = useState("player"),
    [club, setClub] = useState("");
  const [color, setColor] = useState<string>(AVATAR_COLORS[0]),
    [style, setStyle] = useState<string>(AVATAR_STYLES[0]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function inspect() {
    const {
      data: { user },
      error,
    } = await browserSupabase().auth.getUser();
    if (error && !user) {
      setPhase("login");
      return;
    }
    if (!user) {
      setPhase("login");
      return;
    }
    setName(user.user_metadata?.name || user.user_metadata?.full_name || "");
    const profile = user.user_metadata?.padelboard_profile;
    if (profile) {
      setName(profile.name || "");
      setRole(profile.role || "player");
      setClub(profile.club || "");
      setColor(profile.color || AVATAR_COLORS[0]);
      setStyle(profile.style || AVATAR_STYLES[0]);
    }
    setPhase(!editProfile && profile?.completed ? "ready" : "profile");
  }
  useEffect(() => {
    void inspect();
  }, []);
  async function finish() {
    setBusy(true);
    setError("");
    try {
      if (matchId && claimDraft) {
        const r = await fetch(`/api/matches/${matchId}/claim`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ draftToken: getDraftToken(matchId) }),
        });
        if (!r.ok) throw new Error((await r.json()).error);
        clearDraftToken(matchId);
      }
      document.cookie =
        "padelboard_pending_match=; Path=/; Max-Age=0; SameSite=Lax";
      location.assign(shortCode ? `/m/${shortCode}` : "/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
      setBusy(false);
    }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const r = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, role, club, color, style }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      if (editProfile) {
        setSaved(true);
        setBusy(false);
        window.dispatchEvent(new Event("padelboard-profile-updated"));
      } else {
        setPhase("ready");
        await finish();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please retry.");
      setBusy(false);
    }
  }
  return (
    <div className="pbw-finish" aria-live="polite">
      {phase === "loading" && <p>Getting your spot on court ready…</p>}
      {phase === "login" && (
        <>
          <span className="pbw-hand">ONE LAST LITTLE STEP.</span>
          <p>Save your board to your account. Your design stays right here.</p>
          <SignIn matchId={matchId} onSuccess={() => void inspect()} />
        </>
      )}
      {phase === "profile" && (
        <form
          className="pbw-login"
          onSubmit={save}
          onChange={() => setSaved(false)}
          onClick={() => setSaved(false)}
        >
          <div className="pbw-profile-intro">
            <PlayerAvatar color={color} style={style} />
            <div>
              <span className="pbw-hand">MEET YOUR COURT-SIDE SELF.</span>
              <h3>
                {editProfile ? "Your court-side self." : "A little about you."}
              </h3>
              <p>
                {editProfile
                  ? "Choose your look and update your details."
                  : "One quick introduction, then let’s play."}
              </p>
            </div>
          </div>
          <div className="pbw-avatar-options" aria-label="Avatar color">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Avatar color ${c}`}
                aria-pressed={color === c}
                style={{ background: c }}
                onClick={() => setColor(c)}
                disabled={busy}
              />
            ))}
          </div>
          <div className="pbw-avatar-styles">
            {AVATAR_STYLES.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={style === s}
                onClick={() => setStyle(s)}
                disabled={busy}
              >
                {s === "headband"
                  ? "Rally ready"
                  : s === "cap"
                    ? "Club captain"
                    : "Sunny side"}
              </button>
            ))}
          </div>
          <label>
            Your name
            <input
              required
              maxLength={60}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
            />
          </label>
          <div className="pbw-profile-fields">
            <label>
              I’m here as a
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={busy}
              >
                <option value="player">Player</option>
                <option value="club">Club</option>
                <option value="organizer">Organizer / streamer</option>
                <option value="federation">Federation</option>
              </select>
            </label>
            <label>
              Club / community (optional)
              <input
                maxLength={80}
                value={club}
                onChange={(e) => setClub(e.target.value)}
                disabled={busy}
              />
            </label>
          </div>
          <button className="pbw-primary" disabled={busy}>
            {busy
              ? "Saving your court-side self…"
              : editProfile
                ? "Save profile →"
                : "Let’s play →"}
          </button>
        </form>
      )}
      {phase === "ready" && (
        <>
          <span className="pbw-hand">YOU’RE IN. LET’S PLAY.</span>
          <p>Your board is saved and ready for the first serve.</p>
          <button
            className="pbw-primary"
            onClick={() => void finish()}
            disabled={busy}
          >
            {busy ? "Opening your board…" : "Open match controls →"}
          </button>
        </>
      )}
      {saved && <p role="status">✓ Profile saved. Looking good!</p>}
      {error && (
        <p className="pbw-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
