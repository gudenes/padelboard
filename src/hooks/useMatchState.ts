// src/hooks/useMatchState.ts — subscribe to a match row via Supabase Realtime.
"use client";
import { useEffect, useState } from "react";
import { browserSupabase } from "@/lib/supabase";
import type { MatchRow } from "@/types/match";

export function useMatchState(
  matchId: string,
  initial: MatchRow,
  enabled = true,
): MatchRow {
  const [row, setRow] = useState<MatchRow>(initial);

  useEffect(() => {
    if (!enabled) return;
    const sb = browserSupabase();
    let disposed = false;
    const refresh = async () => {
      const { data } = await sb
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();
      if (!disposed && data)
        setRow((prev) =>
          new Date(data.updated_at).getTime() >=
          new Date(prev.updated_at).getTime()
            ? ({ ...prev, ...data } as MatchRow)
            : prev,
        );
    };
    const chan = sb
      .channel(`match:${matchId}`)
      .on("system", {}, (payload) => {
        if (payload.extension === "postgres_changes" && payload.status === "ok")
          void refresh();
      })
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          setRow((prev) => ({
            ...prev,
            ...(payload.new as Partial<MatchRow>),
          }));
        },
      )
      .subscribe();
    return () => {
      disposed = true;
      void sb.removeChannel(chan);
    };
  }, [matchId, enabled]);

  return row;
}
