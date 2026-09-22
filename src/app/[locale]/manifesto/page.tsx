import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublicHeader } from "@/components/home/PublicHeader";
import "@/components/home/playful.css";
import "./manifesto.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "manifesto" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

const richTags = {
  br: () => <br />,
  hl: (chunks: React.ReactNode) => <span>{chunks}</span>,
  link: (chunks: React.ReactNode) => (
    <a href="https://padellabs.tech/" target="_blank" rel="noreferrer">
      {chunks}
    </a>
  ),
};

export default async function ManifestoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("manifesto");

  return (
    <div className="pb-home pb-manifesto">
      <div className="pb-sunshine">
        <PublicHeader manifesto />
        <main>
          <section className="pbm-hero pb-container" aria-labelledby="manifesto-title">
            <p className="pbm-eyebrow">{t("heroEyebrow")}</p>
            <h1 id="manifesto-title">{t.rich("heroTitle", richTags)}</h1>
            <div className="pbm-hero-bottom">
              <p>{t.rich("heroLead", richTags)}</p>
              <span className="pb-hand pbm-scribble">{t.rich("heroScribble", richTags)}</span>
            </div>
            <a className="pbm-read" href="#why">
              {t("heroReadMore")} <span aria-hidden="true">↓</span>
            </a>
          </section>
          <section className="pbm-story" id="why" aria-labelledby="why-title">
            <div className="pb-container pbm-story-grid">
              <div>
                <p className="pbm-eyebrow">{t("beliefEyebrow")}</p>
                <h2 id="why-title">{t.rich("beliefTitle", richTags)}</h2>
              </div>
              <div className="pbm-prose">
                <p>{t("beliefParagraphOne")}</p>
                <p>{t("beliefParagraphTwo")}</p>
                <p className="pbm-emphasis">{t.rich("beliefEmphasis", richTags)}</p>
              </div>
            </div>
          </section>
          <section className="pbm-principles pb-container" aria-labelledby="mission-title">
            <p className="pbm-eyebrow">{t("missionEyebrow")}</p>
            <h2 id="mission-title">{t.rich("missionTitle", richTags)}</h2>
            <div className="pbm-cards">
              <article>
                <span className="pbm-number" aria-hidden="true">01</span>
                <h3>{t("missionCardOneTitle")}</h3>
                <p>{t("missionCardOneBody")}</p>
              </article>
              <article>
                <span className="pbm-number" aria-hidden="true">02</span>
                <h3>{t("missionCardTwoTitle")}</h3>
                <p>{t("missionCardTwoBody")}</p>
              </article>
              <article>
                <span className="pbm-number" aria-hidden="true">03</span>
                <h3>{t("missionCardThreeTitle")}</h3>
                <p>{t("missionCardThreeBody")}</p>
              </article>
            </div>
          </section>
          <section className="pbm-ripple" aria-labelledby="impact-title">
            <div className="pb-container">
              <p className="pbm-eyebrow">{t("impactEyebrow")}</p>
              <h2 id="impact-title">{t.rich("impactTitle", richTags)}</h2>
              <p>{t("impactBody")}</p>
              <span className="pb-hand">{t("impactScribble")}</span>
            </div>
          </section>
          <section className="pbm-labs pb-container" aria-labelledby="labs-title">
            <div>
              <p className="pbm-eyebrow">{t("labsEyebrow")}</p>
              <h2 id="labs-title">{t.rich("labsTitle", richTags)}</h2>
            </div>
            <div className="pbm-prose">
              <p>{t.rich("labsParagraphOne", richTags)}</p>
              <p>{t("labsParagraphTwo")}</p>
            </div>
          </section>
          <section className="pbm-invite pb-container" aria-labelledby="invite-title">
            <span className="pb-hand">{t("inviteScribble")}</span>
            <h2 id="invite-title">{t.rich("inviteTitle", richTags)}</h2>
            <Link href="/dashboard/new" className="pb-button">
              {t("inviteCta")} <span aria-hidden="true">→</span>
            </Link>
            <p>{t("inviteFootnote")}</p>
          </section>
        </main>
      </div>
    </div>
  );
}
