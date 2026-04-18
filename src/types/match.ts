// src/types/match.ts — Shared domain types for the match row and its JSONB columns.

import type { MatchConfig, MatchState } from '@/lib/padel-scoring'

export type TemplateId = 'minimal' | 'broadcast' | 'split'

export interface TeamJson {
  name: string
  players: [string, string]
  color: string
  logoUrl?: string
  country?: string
}

export interface TeamsJson {
  a: TeamJson
  b: TeamJson
}

export interface OverlayJson {
  template: TemplateId
  showTimer: boolean
  showTournament: boolean
  tournamentName?: string
  round?: string
  customColors: {
    accent: string
  }
  scale: number // 0.5 – 1.5 (1.0 = 100%)
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
    a: { name: 'Team A', players: ['', ''], color: '#0a84ff' },
    b: { name: 'Team B', players: ['', ''], color: '#ff453a' },
  }
}

export function defaultOverlay(): OverlayJson {
  return {
    template: 'minimal',
    showTimer: true,
    showTournament: true,
    tournamentName: '',
    round: '',
    customColors: { accent: '#c4d82e' },
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
