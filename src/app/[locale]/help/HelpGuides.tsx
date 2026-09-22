"use client";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type Guide = "studio" | "obs";

const richTags = {
  br: () => <br />,
  b: (chunks: React.ReactNode) => <b>{chunks}</b>,
  code: (chunks: React.ReactNode) => <code>{chunks}</code>,
};

function Shot({
  name,
  alt,
  caption,
}: {
  name: string;
  alt: string;
  caption: string;
}) {
  const t = useTranslations("help");
  return (
    <figure className="pbh-shot">
      <a
        href={`/images/guides/${name}.png`}
        target="_blank"
        rel="noreferrer"
        aria-label={t("shotEnlargeAria", { alt })}
      >
        <img src={`/images/guides/${name}.png`} alt={alt} loading="lazy" />
      </a>
      <figcaption>
        {caption} <span>{t("shotEnlarge")}</span>
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
  const t = useTranslations("help");
  return (
    <figure className="pbh-shot pbh-obs-shot">
      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        aria-label={t("shotEnlargeAria", { alt })}
      >
        <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" />
      </a>
      <figcaption>
        {caption}
        <span>
          <a href={source} target="_blank" rel="noreferrer">
            {t("obsShotSource")}
          </a>{" "}
          {t("obsShotEnlarge")}
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
  const t = useTranslations("help");
  return (
    <section className="pbh-step">
      <span className="pbh-number" aria-hidden="true">
        {n}
      </span>
      <div>
        <h3>
          <span className="pbh-sr">{t("stepLabel", { n })}</span>
          {title}
        </h3>
        {children}
      </div>
    </section>
  );
}
export function HelpGuides() {
  const t = useTranslations("help");
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
        <span className="pbw-hand">{t("heroScribble")}</span>
        <h1>{t.rich("heroTitle", richTags)}</h1>
        <p>{t("heroLead")}</p>
        <span className="pbh-ball" aria-hidden="true">
          ✳
        </span>
      </section>
      <div
        className="pbh-choices"
        role="tablist"
        aria-label={t("guidesAria")}
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
            <small>{t("studioTabEyebrow")}</small>
            <strong>{t("studioTabTitle")}</strong>
            <span>{t("studioTabBody")}</span>
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
            <small>{t("obsTabEyebrow")}</small>
            <strong>{t("obsTabTitle")}</strong>
            <span>{t("obsTabBody")}</span>
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
          <span className="pbw-hand">{t("packScribble")}</span>
          <h2>{t("packTitle")}</h2>
          <ul>
            <li>{t("packItemMatch")}</li>
            <li>
              {t(
                guide === "studio"
                  ? "studioPackItemCamera"
                  : "obsPackItemInstall",
              )}
            </li>
            <li>
              {t(
                guide === "studio"
                  ? "studioPackItemService"
                  : "obsPackItemConnection",
              )}
            </li>
            <li>{t("packItemPhone")}</li>
          </ul>
          <Link href="/dashboard" className="pbw-primary">
            {t("packCta")} →
          </Link>
          <p>{t("packFootnote")}</p>
        </aside>
        <article className="pbh-steps">
          {guide === "studio" ? (
            <>
              <Step n={1} title={t("studioStepOneTitle")}>
                <p>{t.rich("studioStepOneBody", richTags)}</p>
                <Shot
                  name="studio-overview"
                  alt={t("studioStepOneShotAlt")}
                  caption={t("studioStepOneShotCaption")}
                />
              </Step>
              <Step n={2} title={t("studioStepTwoTitle")}>
                <p>{t.rich("studioStepTwoBody", richTags)}</p>
                <div className="pbh-tip">
                  {t.rich("studioStepTwoTip", richTags)}
                </div>
                <p>{t.rich("studioStepTwoLook", richTags)}</p>
                <Shot
                  name="studio-setup"
                  alt={t("studioStepTwoShotAlt")}
                  caption={t("studioStepTwoShotCaption")}
                />
              </Step>
              <Step n={3} title={t("studioStepThreeTitle")}>
                <p>{t.rich("studioStepThreeBody", richTags)}</p>
                <div className="pbh-tip">
                  {t.rich("studioStepThreeTip", richTags)}
                </div>
                <p>{t.rich("studioStepThreeReturn", richTags)}</p>
              </Step>
            </>
          ) : (
            <>
              <Step n={1} title={t("obsStepOneTitle")}>
                <p>{t.rich("obsStepOneBody", richTags)}</p>
                <Shot
                  name="obs-output"
                  alt={t("obsStepOneShotAlt")}
                  caption={t("obsStepOneShotCaption")}
                />
              </Step>
              <Step n={2} title={t("obsStepTwoTitle")}>
                <p>{t.rich("obsStepTwoBody", richTags)}</p>
                <ObsShot
                  src="https://obsproject.com/media/pages/kb/quick-start-guide/bb9f5b282f-1767489968/add-sources-menu.png"
                  alt={t("obsStepTwoMenuShotAlt")}
                  caption={t("obsStepTwoMenuShotCaption")}
                  source="https://obsproject.com/kb/quick-start-guide"
                />
                <ObsShot
                  src="https://obsproject.com/media/pages/kb/browser-source/f506ac48ba-1767490374/browser-properties.png"
                  alt={t("obsStepTwoPropertiesShotAlt")}
                  caption={t("obsStepTwoPropertiesShotCaption")}
                  source="https://obsproject.com/kb/browser-source"
                />
                <div className="pbh-settings">
                  <span>
                    {t("obsSettingsUrlLabel")} <b>{t("obsSettingsUrlValue")}</b>
                  </span>
                  <span>
                    {t("obsSettingsWidthLabel")} <b>1920</b>
                  </span>
                  <span>
                    {t("obsSettingsHeightLabel")} <b>1080</b>
                  </span>
                  <span>
                    {t("obsSettingsBackgroundLabel")}{" "}
                    <b>{t("obsSettingsBackgroundValue")}</b>
                  </span>
                </div>
                <p>{t.rich("obsStepTwoCss", richTags)}</p>
                <a
                  className="pbh-source"
                  href="https://obsproject.com/kb/browser-source"
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("obsStepTwoSourceLink")}
                </a>
              </Step>
              <Step n={3} title={t("obsStepThreeTitle")}>
                <p>{t.rich("obsStepThreeBody", richTags)}</p>
                <div className="pbh-tip">
                  {t.rich("obsStepThreeTip", richTags)}
                </div>
                <ObsShot
                  src="https://obsproject.com/media/pages/kb/quick-start-guide/0fa79f2a03-1767489971/controls-dock.png"
                  alt={t("obsStepThreeShotAlt")}
                  caption={t("obsStepThreeShotCaption")}
                  source="https://obsproject.com/kb/quick-start-guide"
                />
                <p>{t("obsStepThreeDesk")}</p>
              </Step>
            </>
          )}
          <Step n={4} title={t("stepFourTitle")}>
            <p>{t.rich("stepFourBody", richTags)}</p>
            <p>{t.rich("stepFourFocus", richTags)}</p>
            <Shot
              name="focus-controls"
              alt={t("stepFourShotAlt")}
              caption={t("stepFourShotCaption")}
            />
            <div className="pbh-tip">{t.rich("stepFourTip", richTags)}</div>
          </Step>
          <Step n={5} title={t("stepFiveTitle")}>
            <p>{t.rich("stepFiveBody", richTags)}</p>
            <p>{t("stepFiveTiming")}</p>
            <div className="pbh-finish">
              <span className="pbw-hand">{t("finishScribble")}</span>
              <Link className="pbw-primary" href="/dashboard">
                {t("finishCta")} →
              </Link>
            </div>
          </Step>
        </article>
      </div>
      <section className="pbh-faq">
        <span className="pbw-hand">{t("faqScribble")}</span>
        <h2>{t("faqTitle")}</h2>
        <details>
          <summary>{t("faqCameraQuestion")}</summary>
          <p>{t("faqCameraAnswer")}</p>
        </details>
        <details>
          <summary>{t("faqOverlayQuestion")}</summary>
          <p>{t("faqOverlayAnswer")}</p>
        </details>
        <details>
          <summary>{t("faqPhoneQuestion")}</summary>
          <p>{t("faqPhoneAnswer")}</p>
        </details>
      </section>
    </>
  );
}
