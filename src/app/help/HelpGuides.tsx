"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Guide = "studio" | "obs";
function Shot({
  name,
  alt,
  caption,
}: {
  name: string;
  alt: string;
  caption: string;
}) {
  return (
    <figure className="pbh-shot">
      <a
        href={`/images/guides/${name}.png`}
        target="_blank"
        rel="noreferrer"
        aria-label={`Enlarge screenshot: ${alt}`}
      >
        <img src={`/images/guides/${name}.png`} alt={alt} loading="lazy" />
      </a>
      <figcaption>
        {caption} <span>Tap to enlarge ↗</span>
      </figcaption>
    </figure>
  );
}
function ObsShot({
  src,
  alt,
  caption,
  source,
}: {
  src: string;
  alt: string;
  caption: string;
  source: string;
}) {
  return (
    <figure className="pbh-shot pbh-obs-shot">
      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        aria-label={`Enlarge screenshot: ${alt}`}
      >
        <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" />
      </a>
      <figcaption>
        {caption}
        <span>
          <a href={source} target="_blank" rel="noreferrer">
            Screenshot: OBS Project · Official documentation ↗
          </a>{" "}
          · Tap image to enlarge
        </span>
      </figcaption>
    </figure>
  );
}
function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="pbh-step">
      <span className="pbh-number" aria-hidden="true">
        {n}
      </span>
      <div>
        <h3>
          <span className="pbh-sr">Step {n}: </span>
          {title}
        </h3>
        {children}
      </div>
    </section>
  );
}
export function HelpGuides() {
  const [guide, setGuide] = useState<Guide>("studio");
  useEffect(() => {
    const sync = () =>
      setGuide(window.location.hash === "#obs" ? "obs" : "studio");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  function choose(value: Guide) {
    setGuide(value);
    window.history.replaceState(null, "", `#${value}`);
  }
  return (
    <>
      <section className="pbh-hero">
        <span className="pbw-hand">Less setup. More padel.</span>
        <h1>
          Your first stream.
          <br />
          You’ve got this.
        </h1>
        <p>Pick your setup. We’ll take it point by point.</p>
        <span className="pbh-ball" aria-hidden="true">
          ✳
        </span>
      </section>
      <div
        className="pbh-choices"
        role="tablist"
        aria-label="Choose your streaming guide"
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
            return;
          event.preventDefault();
          const next =
            event.key === "Home"
              ? "studio"
              : event.key === "End"
                ? "obs"
                : guide === "studio"
                  ? "obs"
                  : "studio";
          choose(next);
          document.getElementById(`guide-${next}`)?.focus();
        }}
      >
        <button
          id="guide-studio"
          tabIndex={guide === "studio" ? 0 : -1}
          role="tab"
          aria-selected={guide === "studio"}
          aria-controls="guide-panel"
          onClick={() => choose("studio")}
        >
          <span className="pbh-choice-icon" aria-hidden="true">
            ↗
          </span>
          <span>
            <small>THE SIMPLE SETUP · 5 STEPS</small>
            <strong>Padelboard Studio</strong>
            <span>Camera + scoreboard. All in your browser.</span>
          </span>
          <b aria-hidden="true">{guide === "studio" ? "✓" : "→"}</b>
        </button>
        <button
          id="guide-obs"
          tabIndex={guide === "obs" ? 0 : -1}
          role="tab"
          aria-selected={guide === "obs"}
          aria-controls="guide-panel"
          onClick={() => choose("obs")}
        >
          <span className="pbh-choice-icon" aria-hidden="true">
            ▣
          </span>
          <span>
            <small>YOUR EXISTING BROADCAST · 5 STEPS</small>
            <strong>OBS overlay</strong>
            <span>Add a live scoreboard to your OBS scene.</span>
          </span>
          <b aria-hidden="true">{guide === "obs" ? "✓" : "→"}</b>
        </button>
      </div>
      <div
        id="guide-panel"
        role="tabpanel"
        aria-labelledby={`guide-${guide}`}
        className="pbh-guide"
        key={guide}
      >
        <aside className="pbh-pack">
          <span className="pbw-hand">Your match-day kit</span>
          <h2>Before you start</h2>
          <ul>
            <li>A saved match in your Padelboard account.</li>
            <li>
              {guide === "studio"
                ? "A connected camera and a desktop browser with camera access."
                : "OBS Studio installed, with a scene and your camera already set up."}
            </li>
            <li>
              {guide === "studio"
                ? "A streaming service that accepts screen or browser-tab sharing."
                : "An internet connection for live scoreboard updates."}
            </li>
            <li>Optional: your phone, signed in to the same account.</li>
          </ul>
          <Link href="/dashboard" className="pbw-primary">
            Open my matches →
          </Link>
          <p>New here? Create your match, choose a look and save it first.</p>
        </aside>
        <article className="pbh-steps">
          {guide === "studio" ? (
            <>
              <Step n={1} title="Meet your match workspace.">
                <p>
                  Open a match from <b>My matches</b>. In the <b>Live</b> tab,
                  leave the output on <b>Padelboard Studio</b>. This is your
                  camera preview and scoring desk in one place.
                </p>
                <Shot
                  name="studio-overview"
                  alt="Studio selected in the output switch, with camera preview and scoring controls"
                  caption="Studio before the camera starts. Your match stays in the same workspace."
                />
              </Step>
              <Step n={2} title="Set the scene.">
                <p>
                  Choose your camera under <b>Set the scene</b>, then press{" "}
                  <b>Start camera</b> and allow camera access. Drag the
                  scoreboard into place and use <b>Whole scoreboard size</b> to
                  scale the entire board.
                </p>
                <p>
                  Want a different look? <b>Edit board</b> lets you adjust the
                  design. Press <b>Save scoreboard</b> to apply it.
                </p>
                <Shot
                  name="studio-setup"
                  alt="Camera selector, Start camera button, scoreboard position and size, and clean view controls"
                  caption="Camera, position and size live together. Clean view becomes available when the camera is ready."
                />
              </Step>
              <Step n={3} title="Give your audience the clean view.">
                <p>
                  In your streaming service, choose screen or tab sharing and
                  select the Padelboard tab. Back in Studio, press{" "}
                  <b>Clean view to share</b> to show the camera and scoreboard
                  without the controls.
                </p>
                <div className="pbh-tip">
                  <b>A little audio check.</b> Choose your microphone in the
                  streaming service. Studio supplies the camera picture and
                  scoreboard; it does not broadcast directly to YouTube or
                  another platform, or capture your microphone.
                </div>
                <p>
                  Press <b>Esc</b> or double-click the video to return to your
                  controls. Keep this tab open while sharing.
                </p>
              </Step>
            </>
          ) : (
            <>
              <Step n={1} title="Switch your output to OBS.">
                <p>
                  Open your match and stay on the <b>Live</b> tab. Turn on the{" "}
                  <b>OBS</b> switch, then press <b>Copy overlay link</b>. You
                  can tick <b>Remember my choice</b> to keep OBS as your
                  preference on this browser.
                </p>
                <Shot
                  name="obs-output"
                  alt="OBS output selected, live scoreboard preview and Copy overlay link button"
                  caption="Demo match shown. Copy the link from your own match, not the example URL in this screenshot."
                />
              </Step>
              <Step n={2} title="Add one Browser Source.">
                <p>
                  In OBS, open the scene you use for the match. Under{" "}
                  <b>Sources</b>, click <b>+</b>, choose <b>Browser</b>, and
                  name it “Padelboard”. Leave <b>Local file</b> off and paste
                  your overlay link into <b>URL</b>.
                </p>
                <ObsShot
                  src="https://obsproject.com/media/pages/kb/quick-start-guide/bb9f5b282f-1767489968/add-sources-menu.png"
                  alt="OBS add-source menu with Browser near the top"
                  caption="In OBS: Sources → + → Browser. Choose Browser near the top; the official example highlights Game Capture. Name your new source Padelboard."
                  source="https://obsproject.com/kb/quick-start-guide"
                />
                <ObsShot
                  src="https://obsproject.com/media/pages/kb/browser-source/f506ac48ba-1767490374/browser-properties.png"
                  alt="OBS Browser Source properties showing Local file, URL, Width, Height and Custom CSS"
                  caption="This official screenshot shows OBS defaults. Replace its example URL with your Padelboard overlay link and change 800 × 600 to 1920 × 1080. The appearance may vary by OBS version."
                  source="https://obsproject.com/kb/browser-source"
                />
                <div className="pbh-settings">
                  <span>
                    URL <b>Your copied overlay link</b>
                  </span>
                  <span>
                    Width <b>1920</b>
                  </span>
                  <span>
                    Height <b>1080</b>
                  </span>
                  <span>
                    Background <b>Transparent</b>
                  </span>
                </div>
                <p>
                  Keep the default transparent-background CSS. Click <b>OK</b>.
                  Use the overlay URL, which contains <code>/overlay/</code>,
                  rather than your match-control URL.
                </p>
                <a
                  className="pbh-source"
                  href="https://obsproject.com/kb/browser-source"
                  target="_blank"
                  rel="noreferrer"
                >
                  OBS’s official Browser Source guide ↗
                </a>
              </Step>
              <Step n={3} title="Put it above your camera.">
                <p>
                  In the OBS Sources list, move <b>Padelboard</b> above your
                  camera source so the scoreboard appears over the video. If the
                  source is cropped or offset, use{" "}
                  <b>Transform → Fit to Screen</b> as a starting point, then
                  adjust its size and position to suit your scene.
                </p>
                <div className="pbh-tip">
                  <b>One quick check before going live.</b> Confirm the board is
                  visible over the camera and the player names are readable. OBS
                  handles your camera, microphone, recording and broadcast.
                </div>
                <ObsShot
                  src="https://obsproject.com/media/pages/kb/quick-start-guide/0fa79f2a03-1767489971/controls-dock.png"
                  alt="OBS Controls dock with Start Streaming, Start Recording, Studio Mode and Settings"
                  caption="Use Start Recording for a short test. Once your streaming destination is configured in OBS and everything looks right, Start Streaming goes live."
                  source="https://obsproject.com/kb/quick-start-guide"
                />
                <p>
                  Keep Padelboard open as your scoring desk. The overlay follows
                  your saved score and design changes automatically.
                </p>
              </Step>
            </>
          )}
          <Step n={4} title="First serve. You’re in control.">
            <p>
              Choose the server under <b>Change serving player</b>, then press{" "}
              <b>Start match</b> when play begins. Tap <b>+ Point</b> for the
              pair who won the point. Made a mistake? Use <b>Undo last point</b>
              .
            </p>
            <p>
              <b>Focus mode</b> clears away setup controls. You can pause or
              resume the match clock and toggle <b>Show scoreboard</b> or{" "}
              <b>Show match time</b> whenever you need.
            </p>
            <Shot
              name="focus-controls"
              alt="Focus mode with scoring buttons, serving player selector and scoreboard and match-time visibility controls"
              caption="Focus mode, ready for the first serve. Scoring unlocks when you start the match."
            />
            <div className="pbh-tip">
              <b>Prefer scoring courtside?</b> Open <b>Control from phone</b>,
              scan the QR code and sign in to the same account on your phone.
              Keep the broadcast running on your computer. Your phone becomes
              the simple scoring remote.
            </div>
          </Step>
          <Step n={5} title="Call it a match.">
            <p>
              Use <b>Match options → End match</b> and confirm when play is
              finished. Open <b>Insights</b> for the match summary, or find the
              match later in <b>My matches → History</b>.
            </p>
            <p>
              Timing insights use the intervals between your scoring taps. They
              can include the time between rallies, so they are not exact rally
              durations.
            </p>
            <div className="pbh-finish">
              <span className="pbw-hand">Game. Set. Stream.</span>
              <Link className="pbw-primary" href="/dashboard">
                Let’s play →
              </Link>
            </div>
          </Step>
        </article>
      </div>
      <section className="pbh-faq">
        <span className="pbw-hand">A little help courtside</span>
        <h2>Something not playing ball?</h2>
        <details>
          <summary>My camera won’t appear in Studio.</summary>
          <p>
            Check the browser’s camera permission for Padelboard, connect your
            camera and select it under Set the scene. Close other apps using it,
            then retry Start camera. Clean view stays disabled until the camera
            is ready.
          </p>
        </details>
        <details>
          <summary>I can’t see the scoreboard in OBS.</summary>
          <p>
            Check that your Browser Source uses the overlay link from the
            correct match, is visible, and sits above your camera. In
            Padelboard, turn on Show scoreboard on screen. If needed, open the
            source’s properties in OBS and use Refresh cache of current page.
          </p>
        </details>
        <details>
          <summary>Can I use my phone while the computer streams?</summary>
          <p>
            Yes. Use Control from phone and sign in as the match owner. Keep the
            computer, broadcast and internet connection running. The remote is
            for scores, serving, the clock and overlay visibility; full design
            setup stays in the match workspace.
          </p>
        </details>
      </section>
    </>
  );
}
