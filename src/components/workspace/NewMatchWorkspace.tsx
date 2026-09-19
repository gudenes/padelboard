"use client";
import { useState } from "react";
import { PlayfulHome } from "@/components/home/PlayfulHome";
import type { SavedBoardSetup } from "@/lib/reuse-board";
export function NewMatchWorkspace({
  latest,
  aiAvailable,
}: {
  latest: SavedBoardSetup | null;
  aiAvailable: boolean;
}) {
  const [fresh, setFresh] = useState(false);
  return (
    <PlayfulHome
      key={fresh ? "fresh" : "reuse"}
      liveAvailable
      aiAvailable={aiAvailable}
      workspace
      initialBoard={!fresh ? (latest ?? undefined) : undefined}
      onSwitchBoard={latest ? () => setFresh(!fresh) : undefined}
    />
  );
}
