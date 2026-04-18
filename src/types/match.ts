// src/types/match.ts — Shared domain types for the match row and its JSONB columns.

import type { MatchConfig, MatchState } from '@/lib/padel-scoring'

export type TemplateId = 'broadcast' | 'classic' | 'premier' | 'minimal'

export type SlotColors = Record<string, string>            // e.g. { bg: '#0a3d91', text: '#ffffff' }
export type CustomColors = Record<string, SlotColors>      // keyed by slot id, e.g. { playerRow: { bg, text }, ... }

export interface TeamJson {
  name: string
  players: [string, string]
  logoUrl?: string
  country?: string
}

export interface TeamsJson {
  a: TeamJson
  b: TeamJson
}

export interface OverlayJson {
  template: TemplateId                                      // 'broadcast' default for new matches; 'minimal' only for legacy
  showTimer: boolean
  showTournament: boolean
  tournamentName?: string
  round?: string
  tournamentLogoUrl?: string                                // NEW — uploaded logo URL

  // BREAKING: v1 had { accent: string }. v1.1 uses per-slot map.
  // Renderers merge this over the active template's `defaults.colors`.
  customColors: CustomColors

  scale: number
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export interface MatchRow {
  id: string
  short_code: string
  owner_id: string | null
  draft_token: string | null
  status: 'draft' | 'published' | 'finished' | 'abandoned'
  config: MatchConfig
  state: MatchState
  teams: TeamsJson
  overlay: OverlayJson
  tournament_label: string | null
  published_at: string | null
  started_at: string | null
  finished_at: string | null
  created_at: string
  updated_at: string
}

export function defaultTeams(): TeamsJson {
  return {
    a: { name: 'Team A', players: ['', ''] },
    b: { name: 'Team B', players: ['', ''] },
  }
}

export function defaultOverlay(): OverlayJson {
  return {
    template: 'broadcast',
    showTimer: true,
    showTournament: true,
    tournamentName: '',
    round: '',
    tournamentLogoUrl: undefined,
    customColors: {},
    scale: 1.0,
    position: 'top-left',
  }
}

export function defaultConfig(): MatchConfig {
  return {
    format: 'bo3',
    goldenPoint: true,
    superTiebreak: true,
    setTiebreakAt: 6,
  }
}
