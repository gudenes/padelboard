import Link from "next/link";

export function PublicHeader({ manifesto = false }: { manifesto?: boolean }) {
  return (
    <header className="pb-header pb-container pb-public-header">
      <Link href="/" className="pb-wordmark" aria-label="Padelboard home">
        padelboard
        <span className="pb-logo-score"><sup>6</sup><span>/</span><sub>4</sub></span>
      </Link>
      <nav aria-label="Main navigation">
        <Link href="/manifesto" aria-current={manifesto ? "page" : undefined}>Our manifesto</Link>
        <Link href="/help">Help & guides</Link>
        <Link href="/dashboard">My matches</Link>
      </nav>
      <Link className="pb-button pb-nav-cta" href="/login">Sign in <span aria-hidden="true">→</span></Link>
    </header>
  );
}
