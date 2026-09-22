import { NextResponse } from "next/server";
import { serverSupabase, serviceSupabase } from "@/lib/supabase-server";
import { apply, type Action } from "@/lib/padel-scoring";
import { recordPoint } from "@/lib/match-analytics";
import { matchClock, pauseClock, elapsedTime } from "@/lib/match-clock";
import type { MatchRow } from "@/types/match";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { action, draftToken } = await req.json();
  const kinds = [
    "point_for",
    "undo",
    "mark_retirement",
    "mark_walkover",
    "reset",
    "start_clock",
    "pause_clock",
    "finish_match",
    "show_timer",
    "show_scoreboard",
    "set_server",
  ];
  if (
    !action ||
    !kinds.includes(action.kind) ||
    (["point_for", "mark_retirement", "mark_walkover", "set_server"].includes(
      action.kind,
    ) &&
      !["a", "b"].includes(action.team)) ||
    (["show_timer", "show_scoreboard"].includes(action.kind) &&
      typeof action.value !== "boolean") ||
    (action.kind === "set_server" && ![0, 1].includes(action.player))
  )
    return NextResponse.json({ error: "action_invalid" }, { status: 400 });
  const svc = serviceSupabase();
  const { data } = await svc.from("matches").select("*").eq("id", id).single();
  if (!data)
    return NextResponse.json({ error: "match_not_found" }, { status: 404 });
  const row = data as MatchRow;
  let authorized = false;
  if (row.owner_id) {
    const sb = await serverSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    authorized = user?.id === row.owner_id;
  } else
    authorized =
      row.status === "draft" && !!draftToken && draftToken === row.draft_token;
  if (!authorized)
    return NextResponse.json({ error: "not_match_owner" }, { status: 403 });
  const now = Date.now(),
    iso = new Date(now).toISOString();
  const clock = matchClock(row);
  const patch: Partial<MatchRow> = {};
  if (action.kind === "show_timer")
    patch.overlay = { ...row.overlay, showTimer: action.value };
  else if (action.kind === "show_scoreboard")
    patch.overlay = { ...row.overlay, showScoreboard: action.value };
  else if (action.kind === "set_server") {
    if (row.status === "finished")
      return NextResponse.json(
        { error: "match_finished_server_change" },
        { status: 409 },
      );
    patch.state = apply(row.state, action as Action);
  } else if (action.kind === "start_clock") {
    if (row.status === "finished")
      return NextResponse.json({ error: "match_finished" }, { status: 409 });
    patch.started_at = row.started_at || iso;
    patch.overlay = {
      ...row.overlay,
      clock: { ...clock, runningSince: clock.runningSince || iso },
    };
  } else if (action.kind === "pause_clock")
    patch.overlay = {
      ...(patch.overlay ?? row.overlay),
      clock: pauseClock(clock, now),
    };
  else if (action.kind === "finish_match") {
    patch.status = "finished";
    patch.finished_at = iso;
    patch.overlay = {
      ...(patch.overlay ?? row.overlay),
      clock: pauseClock(clock, now),
    };
  } else {
    if (row.status === "finished" && !["undo", "reset"].includes(action.kind))
      return NextResponse.json({ error: "match_finished" }, { status: 409 });
    if (action.kind === "point_for" && row.owner_id && !clock.runningSince)
      return NextResponse.json({ error: "match_not_started" }, { status: 409 });
    const history = [...(row.overlay.scoreHistory ?? [])];
    if (action.kind === "undo" && !history.length)
      return NextResponse.json({ error: "no_point_to_undo" }, { status: 409 });
    const state =
      action.kind === "undo"
        ? history.pop()!
        : apply(row.state, action as Action);
    if (action.kind !== "undo" && action.kind !== "reset")
      history.push(row.state);
    patch.overlay = {
      ...row.overlay,
      scoreHistory: action.kind === "reset" ? [] : history.slice(-1000),
    };
    patch.state = state;
    if (action.kind === "reset") {
      patch.status = row.owner_id ? "published" : "draft";
      patch.started_at = null;
      patch.finished_at = null;
      patch.overlay = {
        ...(patch.overlay ?? row.overlay),
        clock: { elapsedMs: 0, runningSince: null },
      };
    } else if (state.phase === "finished") {
      patch.status = "finished";
      patch.finished_at = iso;
      patch.overlay = {
        ...(patch.overlay ?? row.overlay),
        clock: pauseClock(clock, now),
      };
    } else if (row.status === "finished") {
      patch.status = row.owner_id ? "published" : "draft";
      patch.finished_at = null;
      patch.overlay = {
        ...(patch.overlay ?? row.overlay),
        clock: pauseClock(clock, now),
      };
    } else if (!row.started_at && action.kind === "point_for") {
      patch.started_at = iso;
      patch.overlay = {
        ...(patch.overlay ?? row.overlay),
        clock: { elapsedMs: 0, runningSince: iso },
      };
    }
  }
  if (
    action.kind === "start_clock" &&
    !row.started_at &&
    !row.overlay.analytics
  ) {
    patch.overlay = {
      ...(patch.overlay ?? row.overlay),
      analytics: { baselineMs: 0, points: [] },
    };
  }
  if (action.kind === "point_for") {
    patch.overlay = {
      ...(patch.overlay ?? row.overlay),
      analytics: recordPoint(
        row.overlay.analytics,
        row.state,
        patch.state!,
        action.team,
        elapsedTime(clock, now),
      ),
    };
  } else if (action.kind === "undo" && row.overlay.analytics) {
    patch.overlay = {
      ...(patch.overlay ?? row.overlay),
      analytics: {
        ...row.overlay.analytics,
        points: row.overlay.analytics.points.slice(0, -1),
      },
    };
  } else if (action.kind === "reset") {
    patch.overlay = {
      ...(patch.overlay ?? row.overlay),
      analytics: { baselineMs: 0, points: [] },
    };
  }
  const { data: updated, error } = await svc
    .from("matches")
    .update(patch)
    .eq("id", id)
    .eq("updated_at", row.updated_at)
    .select("*")
    .single();
  if (error || !updated)
    return NextResponse.json(
      { error: "match_changed_elsewhere" },
      { status: 409 },
    );
  await svc.from("match_events").insert({
    match_id: id,
    kind: action.kind,
    payload: action,
    state_after: updated.state,
  });
  return NextResponse.json({
    state: updated.state,
    row: { ...updated, draft_token: null },
  });
}
