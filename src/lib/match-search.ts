import type { MatchRow } from "@/types/match";
import { matchClock } from "./match-clock";
import { getDeuceRule } from "./padel-scoring";
export type MatchStatusId =
  | "finished"
  | "abandoned"
  | "draft"
  | "live"
  | "paused"
  | "ready";
export function matchStatusId(row: MatchRow): MatchStatusId {
  if (row.status === "finished") return "finished";
  if (row.status === "abandoned") return "abandoned";
  if (row.status === "draft") return "draft";
  return matchClock(row).runningSince
    ? "live"
    : row.started_at
      ? "paused"
      : "ready";
}
/**
 * Palavras inglesas do estado — só para o índice de pesquisa. O texto que se
 * mostra vem das traduções, indexado por `matchStatusId`; quem escrever
 * "finished" continua a encontrar o jogo em qualquer língua.
 */
const MATCH_STATUS_LABELS: Record<MatchStatusId, string> = {
  finished: "Finished",
  abandoned: "Abandoned",
  draft: "Draft",
  live: "Live",
  paused: "Paused",
  ready: "Ready",
};
/** Não usar para apresentação: devolve sempre inglês. Ver MATCH_STATUS_LABELS. */
export function matchStatus(row: MatchRow): string {
  return MATCH_STATUS_LABELS[matchStatusId(row)];
}
function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
function localizedDates(date: Date, locale: string): string[] {
  return [
    date.toLocaleDateString(locale, { timeZone: "UTC" }),
    date.toLocaleDateString(locale, {
      month: "long",
      year: "numeric",
      day: "numeric",
      timeZone: "UTC",
    }),
  ];
}
export function matchesSearch(
  row: MatchRow,
  query: string,
  locale?: string,
): boolean {
  const date = new Date(row.created_at);
  const fields = [
    row.short_code,
    row.status,
    matchStatus(row),
    row.overlay.tournamentName,
    row.tournament_label,
    row.overlay.round,
    row.overlay.template,
    row.overlay.customDesign?.logoText,
    row.teams.a.name,
    row.teams.b.name,
    ...row.teams.a.players,
    ...row.teams.b.players,
    row.teams.a.country,
    row.teams.b.country,
    row.created_at.slice(0, 10),
    ...localizedDates(date, "en-GB"),
    ...(locale && locale !== "en-GB" ? localizedDates(date, locale) : []),
    row.config.format,
    {
      bo3: "best of 3",
      bo5: "best of 5",
      "pro-set": "pro set",
      "single-set": "single set",
    }[row.config.format],
    getDeuceRule(row.config),
    row.config.superTiebreak ? "super tiebreak" : "",
    row.state.sets.map((s) => `${s.a}-${s.b}`).join(" "),
  ];
  const text = normalize(fields.filter(Boolean).join(" "));
  return normalize(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => text.includes(token));
}
