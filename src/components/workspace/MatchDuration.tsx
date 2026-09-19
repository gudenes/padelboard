"use client";
import { useEffect, useState } from "react";
import { elapsedTime, formatDuration, matchClock } from "@/lib/match-clock";
import type { MatchRow } from "@/types/match";
export function MatchDuration({ row }: { row: MatchRow }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const clock = matchClock(row);
  return (
    <time style={{ fontVariantNumeric: "tabular-nums" }}>
      {formatDuration(now === null ? clock.elapsedMs : elapsedTime(clock, now))}
    </time>
  );
}
