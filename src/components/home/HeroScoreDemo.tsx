"use client";
import { useEffect, useRef, useState } from "react";
import { HandTap } from "@phosphor-icons/react";
import { TourScoreboard } from "@/components/scoreboard/TourScoreboard";
import {
  apply,
  createInitialState,
  type MatchState,
} from "@/lib/padel-scoring";
import { defaultConfig } from "@/types/match";
function demoState(): MatchState {
  return {
    ...createInitialState(defaultConfig()),
    sets: [
      { a: 6, b: 3 },
      { a: 4, b: 4 },
    ],
    currentGame: { a: 30, b: 15 },
  };
}
export function HeroScoreDemo() {
  const [score, setScore] = useState(demoState),
    [tapping, setTapping] = useState(false);
  const root = useRef<HTMLDivElement>(null),
    timers = useRef<ReturnType<typeof setTimeout>[]>([]),
    interacted = useRef(false);
  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }
  function tap() {
    clearTimers();
    setTapping(true);
    timers.current.push(
      setTimeout(
        () =>
          setScore((previous) =>
            previous.phase === "finished"
              ? demoState()
              : apply(previous, { kind: "point_for", team: "a" }),
          ),
        180,
      ),
    );
    timers.current.push(setTimeout(() => setTapping(false), 700));
  }
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          timers.current.push(
            setTimeout(() => {
              if (!interacted.current) tap();
            }, 1400),
          );
        }
      },
      { threshold: 0.6 },
    );
    if (root.current) observer.observe(root.current);
    return () => {
      observer.disconnect();
      clearTimers();
    };
  }, []);
  return (
    <div ref={root} className={`pb-hero-demo ${tapping ? "is-tapping" : ""}`}>
      <div className="pb-hero-board">
        <TourScoreboard
          names={["Galán / Chingotto", "Coello / Tapia"]}
          state={score}
          accent="#f5ff36"
          title="FINAL · MADRID P1"
        />
      </div>
      <div className="pb-demo-control">
        <button
          onClick={() => {
            interacted.current = true;
            tap();
          }}
          aria-label={
            score.phase === "finished"
              ? "Replay scoring demo"
              : "Demo: add a point to Galán / Chingotto"
          }
        >
          <span className="pb-demo-tap">
            <HandTap weight="bold" />
            <i aria-hidden="true" />
          </span>
          {score.phase === "finished" ? "Replay demo" : "+ Point"}
        </button>
        <span>Tap. Score. Simple.</span>
      </div>
    </div>
  );
}
