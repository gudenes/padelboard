"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./project-footer.css";

export function ProjectFooter() {
  const path = usePathname();
  if (path.startsWith("/overlay/") || path.endsWith("/remote")) return null;
  return (
    <footer className="pbl-footer" aria-label="About Padelboard">
      <div className="pbl-footer-inner">
        <div className="pbl-footer-note">
          <span className="pbl-footer-mark" aria-hidden="true">
            ✳
          </span>
          <div>
            <p>Made for the love of the game.</p>
          </div>
        </div>
        <a
          className="pbl-footer-project"
          href="https://padellabs.tech/"
          target="_blank"
          rel="noreferrer"
        >
          <span>A project by</span>
          <strong>
            padel labs<span aria-hidden="true"> ↗</span>
          </strong>
        </a>
        <nav aria-label="Footer navigation">
          <Link href="/help">Help & guides</Link>
        </nav>
      </div>
    </footer>
  );
}
