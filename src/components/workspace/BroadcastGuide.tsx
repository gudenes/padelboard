"use client";
import { useEffect, useRef, useState } from "react";

type Destination = "youtube" | "other" | "practice";
type Output = "studio" | "obs";

export function BroadcastGuide({ code, owner, output, onOutput }: {
  code: string; owner: string | null; output: Output; onOutput: (output: Output) => void;
}) {
  const key = `padelboard:broadcast-guide:${owner}:${code}`;
  const dialog = useRef<HTMLDialogElement>(null);
  const [destination, setDestination] = useState<Destination>("youtube");
  const [step, setStep] = useState(0);
  const [checks, setChecks] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      const saved = raw ? JSON.parse(raw) : null;
      if (["youtube", "other", "practice"].includes(saved?.destination)) setDestination(saved.destination);
    } catch { /* Optional browser preference. */ }
  }, [key]);
  function close() {
    dialog.current?.close();
    try { localStorage.setItem(key, JSON.stringify({ destination, dismissed: true })); } catch { /* Optional browser preference. */ }
  }
  const practice = destination === "practice";
  const items = practice
    ? ["I can see the court and read both pairs’ names.", "I know where the point buttons and Undo are."]
    : ["The court and scoreboard are visible in my streaming tool.", "I checked the microphone and listened to a test recording.", "I checked the preview on a phone: names and points are readable."];
  return (
    <>
    <button className="pbw-secondary" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>Help me stream →</button>
    <dialog ref={dialog} className="pbw-guide-dialog" aria-labelledby="broadcast-guide-title" onCancel={(event) => { event.preventDefault(); close(); }}>
    <section className="pbw-broadcast-guide" aria-label="Streaming setup guide">
      <div className="pbw-guide-heading">
        <div><span className="pbw-hand">NEXT STOP: YOUR AUDIENCE.</span><h2 id="broadcast-guide-title">Your board is ready. Let’s give it a stage.</h2></div>
        <button className="pbw-secondary" onClick={close} aria-label="Close streaming guide">Close ×</button>
      </div>
      <div id="broadcast-guide-content">
        <nav className="pbw-guide-progress" aria-label="Setup steps">{["Destination", "Your setup", "Sound check"].map((label, i) => <button key={label} aria-current={step === i ? "step" : undefined} onClick={() => setStep(i)}><span>{i + 1}</span>{label}</button>)}</nav>
        <div className="pbw-guide-content" key={`${step}-${output}-${destination}`}>
          {step === 0 && <>
            <h3>Where will people watch?</h3>
            <div className="pbw-guide-options">{([
              ["youtube", "▶", "YouTube", "A live match on your channel."],
              ["other", "↗", "Another platform", "Use your existing streaming service."],
              ["practice", "✳", "Just trying it out", "Get comfortable before going live."],
            ] as const).map(([value, icon, title, detail]) => <button key={value} aria-pressed={destination === value} onClick={() => { setDestination(value); setChecks([]); }}><span className="pbw-guide-icon">{icon}</span><strong>{title}</strong><small>{detail}</small></button>)}</div>
            {destination === "youtube" && <p>First YouTube live? Enable live streaming on your channel ahead of the match — activation can take up to 24 hours. <a href="https://www.youtube.com/livestreaming" target="_blank" rel="noreferrer">Open YouTube Live ↗</a></p>}
          </>}
          {step === 1 && <>
            <h3>{practice ? "Pick your practice setup." : "How will you put the match on screen?"}</h3>
            <div className="pbw-guide-options">{(["studio", "obs"] as const).map(value => <button key={value} aria-pressed={output === value} onClick={() => { onOutput(value); setChecks([]); }}><strong>{value === "studio" ? "Padelboard Studio" : "OBS overlay"}</strong><small>{value === "studio" ? "Build your camera + scoreboard scene here." : "Add the scoreboard to your OBS scene."}</small></button>)}</div>
            {output === "studio" ? <ol>
              <li>Close this guide to select your camera or share a screen and position your board. You can reopen it anytime.</li>
              {!practice && <li>In a browser broadcasting service that supports screen sharing, connect {destination === "youtube" ? "your YouTube channel" : "your destination"}. Share this Padelboard tab and turn on <b>Clean view to share</b>.</li>}
              <li>{practice ? "Try the scene before starting the match." : "Select your microphone in that broadcasting service. Use Phone control to score while the clean scene stays on screen."}</li>
            </ol> : <ol>
              <li>In OBS, add your camera under Sources → Video Capture Device.</li>
              <li>Close this guide and copy the overlay link in the OBS panel. Add Sources → Browser, paste the link and set 1920 × 1080. Keep it above the camera in Sources.</li>
              {!practice && <li>In Settings → Stream, connect {destination === "youtube" ? "YouTube" : "your destination"}. Check your microphone in the Audio Mixer.</li>}
            </ol>}
            <p className="pbw-guide-note">{output === "studio" ? "Studio prepares the picture; your broadcasting service sends it live. YouTube’s webcam mode won’t add this scene automatically. External services may require a paid plan." : "OBS sends the stream; Padelboard keeps the score. Nothing goes live just by completing this guide."}</p>
            <a href={`/help#${output}`} target="_blank" rel="noreferrer">See the guide with screenshots ↗</a>
          </>}
          {step === 2 && <>
            <h3>{practice ? "A little warm-up." : "Quick check. Big match energy."}</h3>
            <p>{practice ? "Use a practice match for test points so your real match insights stay accurate." : "Make a short test recording or a private stream first. These are your checks — Padelboard cannot detect your broadcast status."}</p>
            <div className="pbw-guide-checks">{items.map(item => <label key={item}><input type="checkbox" checked={checks.includes(item)} onChange={e => setChecks(e.target.checked ? [...checks, item] : checks.filter(x => x !== item))} />{item}</label>)}</div>
            {!practice && <p>When everything looks and sounds right, start the broadcast in {output === "obs" ? "OBS" : "your streaming service"}{destination === "youtube" ? " and confirm it in YouTube Live Control Room" : ""}. Start the match clock here when play begins.</p>}
          </>}
        </div>
        <div className="pbw-guide-footer"><button className="pbw-secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>← Back</button><span>{step + 1} / 3</span><button className="pbw-primary" onClick={() => step < 2 ? setStep(step + 1) : close()}>{step < 2 ? "Continue →" : "Back to my match →"}</button></div>
      </div>
    </section>
    </dialog>
    </>
  );
}
