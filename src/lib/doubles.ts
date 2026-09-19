import type { TeamsJson } from "@/types/match";
export type DoublesPlayers = [string, string, string, string];
export function doublesTeams(players: DoublesPlayers): TeamsJson {
  const pair = (a: string, b: string) => ({
    name: [a.trim(), b.trim()].join(" / "),
    players: [a.trim(), b.trim()] as [string, string],
  });
  return { a: pair(players[0], players[1]), b: pair(players[2], players[3]) };
}
