"use client";
import { usePathname } from "next/navigation";
import "./project-footer.css";

export function ProjectFooter() {
  const path = usePathname();
  if (path.startsWith("/overlay/") || path.endsWith("/remote")) return null;
  return (
    <footer className="pbl-footer" aria-label="About Padelboard">
      <p>Made for the love of the game.</p>
    </footer>
  );
}
