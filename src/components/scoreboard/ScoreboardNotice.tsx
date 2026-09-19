"use client";
import { useEffect, useState } from "react";
export function ScoreboardNotice({ label }: { label: string }) {
  const [display, setDisplay] = useState(label),
    [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    const timer = setTimeout(() => {
      setDisplay(label);
      setVisible(Boolean(label));
    }, 180);
    return () => clearTimeout(timer);
  }, [label]);
  return (
    <div
      className={`pb-score-notice ${visible ? "is-visible" : ""}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="pb-score-notice-clip">
        <div className="pb-score-notice-text">{display}</div>
      </div>
    </div>
  );
}
