import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/home/PublicHeader";
import "@/components/home/playful.css";
import "./manifesto.css";

export const metadata: Metadata = {
  title: "Our manifesto — Padelboard",
  description: "Every match deserves a spotlight. Why Padelboard is a free Padel Labs initiative making professional-looking padel streams accessible to everyone.",
};

export default function ManifestoPage() {
  return (
    <div className="pb-home pb-manifesto">
      <div className="pb-sunshine">
        <PublicHeader manifesto />
        <main>
          <section className="pbm-hero pb-container" aria-labelledby="manifesto-title">
            <p className="pbm-eyebrow">THE PADELBOARD MANIFESTO</p>
            <h1 id="manifesto-title">Every match<br />deserves a <span>spotlight.</span></h1>
            <div className="pbm-hero-bottom">
              <p>A Friday-night friendly. A first tournament. A club final.<br />If it matters on court, it deserves to look the part on screen.</p>
              <span className="pb-hand pbm-scribble">More courts.<br />More stories.<br />More padel.</span>
            </div>
            <a className="pbm-read" href="#why">This is why we build <span aria-hidden="true">↓</span></a>
          </section>
          <section className="pbm-story" id="why" aria-labelledby="why-title">
            <div className="pb-container pbm-story-grid">
              <div><p className="pbm-eyebrow">01 / THE BELIEF</p><h2 id="why-title">Big-match energy.<br />On every court.</h2></div>
              <div className="pbm-prose">
                <p>Padel is full of moments worth sharing. The impossible recovery. The deciding point. The pair who finally win their first match together.</p>
                <p>We believe a professional-looking broadcast should be within reach of anyone who wants to share those moments. A player. A friend. A coach. A club.</p>
                <p className="pbm-emphasis">You bring the match.<br />We help you bring it to the world.</p>
              </div>
            </div>
          </section>
          <section className="pbm-principles pb-container" aria-labelledby="mission-title">
            <p className="pbm-eyebrow">02 / THE MISSION</p>
            <h2 id="mission-title">Less setup.<br /><span>More “are you watching this?”</span></h2>
            <div className="pbm-cards">
              <article><span className="pbm-number" aria-hidden="true">01</span><h3>Make it simple.</h3><p>You should be thinking about the next point, not stitching together a pile of tools. A scoreboard, your match, and a simpler way to get it on screen.</p></article>
              <article><span className="pbm-number" aria-hidden="true">02</span><h3>Make it look the part.</h3><p>Clear scores. Your club’s colors. A broadcast you’re proud to share. Professional presentation should belong to every court, whatever the size of the event.</p></article>
              <article><span className="pbm-number" aria-hidden="true">03</span><h3>Open the court.</h3><p>Padelboard is a free initiative because the cost of a scoreboard shouldn’t stand between a match and its audience. More people should get to press play.</p></article>
            </div>
          </section>
          <section className="pbm-ripple" aria-labelledby="impact-title">
            <div className="pb-container">
              <p className="pbm-eyebrow">03 / THE BIGGER PICTURE</p>
              <h2 id="impact-title">More matches seen.<br />More people hooked.<br /><span>More room for padel to grow.</span></h2>
              <p>We want to be a catalyst. To help clubs reach their communities, players share their stories, and new fans discover the game. Making it easier to broadcast is our way of helping padel take its next step.</p>
              <span className="pb-hand">One stream can start something.</span>
            </div>
          </section>
          <section className="pbm-labs pb-container" aria-labelledby="labs-title">
            <div><p className="pbm-eyebrow">BUILT WITH PURPOSE</p><h2 id="labs-title">A little project.<br />A big love for padel.</h2></div>
            <div className="pbm-prose"><p>Padelboard is a <a href="https://padellabs.tech/" target="_blank" rel="noreferrer">Padel Labs project ↗</a>. It’s our contribution to a sport we love: practical technology that helps more people take part.</p><p>We’re building for the people beside the court. And we want to keep learning from them. Every match you share, every idea, every bit of feedback helps shape what comes next.</p></div>
          </section>
          <section className="pbm-invite pb-container" aria-labelledby="invite-title">
            <span className="pb-hand">Your court is next.</span>
            <h2 id="invite-title">Let’s give your match<br />its moment.</h2>
            <Link href="/dashboard/new" className="pb-button">Create your board <span aria-hidden="true">→</span></Link>
            <p>Free to get started. Made for the love of the game.</p>
          </section>
        </main>
      </div>
    </div>
  );
}
