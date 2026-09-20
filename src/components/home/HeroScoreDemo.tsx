"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { HandTap, Pause, Play } from "@phosphor-icons/react";
import { TourScoreboard } from "@/components/scoreboard/TourScoreboard";
import {
  apply,
  createInitialState,
  type MatchState,
  type TeamId,
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
const sequence: TeamId[] = ["a", "b", "b", "a", "a", "b", "a", "b"];
const pairs = [
  { team: "a" as const, name: "Galán / Chingotto" },
  { team: "b" as const, name: "Coello / Tapia" },
];
export function HeroScoreDemo() {
  const [score, setScore] = useState(demoState),
    [tapping, setTapping] = useState<TeamId | null>(null),
    [paused, setPaused] = useState(true),
    [visible, setVisible] = useState(false);
  const root = useRef<HTMLDivElement>(null),
    release = useRef<ReturnType<typeof setTimeout> | null>(null),
    index = useRef(0);
  const tap = useCallback((team: TeamId) => {
    if (release.current) clearTimeout(release.current);
    setTapping(team);
    setScore((previous) =>
      apply(previous.phase === "finished" ? demoState() : previous, {
        kind: "point_for",
        team,
      }),
    );
    release.current = setTimeout(() => setTapping(null), 650);
  }, []);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPaused(preference.matches);
    const change = () => setPaused(preference.matches);
    preference.addEventListener("change", change);
    let inView = false;
    const update = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries.some((e) => e.isIntersecting);
        update();
      },
      { threshold: 0.5 },
    );
    if (root.current) observer.observe(root.current);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", change);
      document.removeEventListener("visibilitychange", update);
      if (release.current) clearTimeout(release.current);
    };
  }, []);
  useEffect(() => {
    if (paused || !visible) return;
    const timer = setInterval(() => {
      if (index.current >= sequence.length) {
        index.current = 0;
        setScore(demoState());
        setTapping(null);
      } else tap(sequence[index.current++]);
    }, 2300);
    return () => clearInterval(timer);
  }, [paused, visible, tap]);
  return (
    <div
      ref={root}
      className={`pb-hero-demo ${tapping ? `is-tapping tap-${tapping}` : ""}`}
    >
      <div className="pb-hero-board">
        <TourScoreboard
          announce={paused}
          names={[pairs[0].name, pairs[1].name]}
          state={score}
          accent="#f5ff36"
          title="FINAL · MADRID P1"
        />
      </div>
      <div className="pb-demo-pairs">
        {pairs.map(({ team, name }) => (
          <button
            key={team}
            className={`pb-demo-pair ${tapping === team ? "is-active" : ""}`}
            onClick={() => {
              setPaused(true);
              tap(team);
            }}
            aria-label={`Demo: add a point to ${name}`}
          >
            <span className="pb-demo-pair-name">{name}</span>
            <span className="pb-demo-point">
              <span className="pb-demo-tap">
                <HandTap weight="bold" />
                <i aria-hidden="true" />
              </span>
              + Point
            </span>
          </button>
        ))}
      </div>
      <div className="pb-demo-playback">
        <span>Tap. Score. Simple.</span>
        <button
          onClick={() => setPaused((value) => !value)}
          aria-label={paused ? "Play scoring demo" : "Pause scoring demo"}
        >
          {paused ? <Play weight="fill" /> : <Pause weight="fill" />}
          {paused ? "Play demo" : "Pause demo"}
        </button>
      </div>
    </div>
  );
}
