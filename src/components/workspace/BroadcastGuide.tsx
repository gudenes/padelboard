"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type Destination = "youtube" | "other" | "practice";
type Output = "studio" | "obs";

/**
 * Os passos e os itens da checklist são identificados por chave de mensagem,
 * nunca pela frase visível: `checks` guarda ids estáveis, para que trocar de
 * língua não apague as marcas do utilizador. O mesmo vale para `key` no React.
 */
const STEPS = ["guideStepDestination", "guideStepSetup", "guideStepSound"] as const;
const PRACTICE_CHECKS = ["guideCheckPracticeCourt", "guideCheckPracticeControls"] as const;
const LIVE_CHECKS = ["guideCheckLiveScene", "guideCheckLiveSound", "guideCheckLivePreview"] as const;
type CheckId = (typeof PRACTICE_CHECKS)[number] | (typeof LIVE_CHECKS)[number];

export function BroadcastGuide({ code, owner, output, onOutput }: {
  code: string; owner: string | null; output: Output; onOutput: (output: Output) => void;
}) {
  const t = useTranslations("studio");
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
  const items: readonly CheckId[] = practice ? PRACTICE_CHECKS : LIVE_CHECKS;
  return (
    <>
    <button className="pbw-secondary" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>{t("guideOpen")}</button>
    <dialog ref={dialog} className="pbw-guide-dialog" aria-labelledby="broadcast-guide-title" onCancel={(event) => { event.preventDefault(); close(); }}>
    <section className="pbw-broadcast-guide" aria-label={t("guideAria")}>
      <div className="pbw-guide-heading">
        <div><span className="pbw-hand">{t("guideEyebrow")}</span><h2 id="broadcast-guide-title">{t("guideTitle")}</h2></div>
        <button className="pbw-secondary" onClick={close} aria-label={t("guideCloseAria")}>{t("guideClose")}</button>
      </div>
      <div id="broadcast-guide-content">
        <nav className="pbw-guide-progress" aria-label={t("guideStepsAria")}>{STEPS.map((id, i) => <button key={id} aria-current={step === i ? "step" : undefined} onClick={() => setStep(i)}><span>{i + 1}</span>{t(id)}</button>)}</nav>
        <div className="pbw-guide-content" key={`${step}-${output}-${destination}`}>
          {step === 0 && <>
            <h3>{t("guideDestinationTitle")}</h3>
            <div className="pbw-guide-options">{([
              ["youtube", "▶", "YouTube", t("guideDestinationYoutubeDetail")],
              ["other", "↗", t("guideDestinationOtherTitle"), t("guideDestinationOtherDetail")],
              ["practice", "✳", t("guideDestinationPracticeTitle"), t("guideDestinationPracticeDetail")],
            ] as const).map(([value, icon, title, detail]) => <button key={value} aria-pressed={destination === value} onClick={() => { setDestination(value); setChecks([]); }}><span className="pbw-guide-icon">{icon}</span><strong>{title}</strong><small>{detail}</small></button>)}</div>
            {destination === "youtube" && <p>{t.rich("guideYoutubeNote", { link: (chunks) => <a href="https://www.youtube.com/livestreaming" target="_blank" rel="noreferrer">{chunks}</a> })}</p>}
          </>}
          {step === 1 && <>
            <h3>{practice ? t("guideSetupTitlePractice") : t("guideSetupTitle")}</h3>
            <div className="pbw-guide-options">{(["studio", "obs"] as const).map(value => <button key={value} aria-pressed={output === value} onClick={() => { onOutput(value); setChecks([]); }}><strong>{value === "studio" ? t("guideOutputStudio") : t("guideOutputObs")}</strong><small>{value === "studio" ? t("guideOutputStudioDetail") : t("guideOutputObsDetail")}</small></button>)}</div>
            {output === "studio" ? <ol>
              <li>{t("guideStudioStepOne")}</li>
              {!practice && <li>{t.rich(destination === "youtube" ? "guideStudioStepTwoYoutube" : "guideStudioStepTwoOther", { b: (chunks) => <b>{chunks}</b> })}</li>}
              <li>{practice ? t("guideStudioStepThreePractice") : t("guideStudioStepThree")}</li>
            </ol> : <ol>
              <li>{t("guideObsStepOne")}</li>
              <li>{t("guideObsStepTwo")}</li>
              {!practice && <li>{t(destination === "youtube" ? "guideObsStepThreeYoutube" : "guideObsStepThreeOther")}</li>}
            </ol>}
            <p className="pbw-guide-note">{output === "studio" ? t("guideNoteStudio") : t("guideNoteObs")}</p>
            <a href={`/help#${output}`} target="_blank" rel="noreferrer">{t("guideScreenshots")}</a>
          </>}
          {step === 2 && <>
            <h3>{practice ? t("guideCheckTitlePractice") : t("guideCheckTitle")}</h3>
            <p>{practice ? t("guideCheckBodyPractice") : t("guideCheckBody")}</p>
            <div className="pbw-guide-checks">{items.map(id => <label key={id}><input type="checkbox" checked={checks.includes(id)} onChange={e => setChecks(e.target.checked ? [...checks, id] : checks.filter(x => x !== id))} />{t(id)}</label>)}</div>
            {!practice && <p>{t(output === "obs"
              ? (destination === "youtube" ? "guideGoLiveObsYoutube" : "guideGoLiveObs")
              : (destination === "youtube" ? "guideGoLiveStudioYoutube" : "guideGoLiveStudio"))}</p>}
          </>}
        </div>
        <div className="pbw-guide-footer"><button className="pbw-secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>{t("guideBack")}</button><span>{t("guideProgress", { current: step + 1, total: STEPS.length })}</span><button className="pbw-primary" onClick={() => step < 2 ? setStep(step + 1) : close()}>{step < 2 ? t("guideContinue") : t("guideDone")}</button></div>
      </div>
    </section>
    </dialog>
    </>
  );
}
