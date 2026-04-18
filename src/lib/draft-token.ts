// src/lib/draft-token.ts — Generate + persist draft tokens in localStorage.

import { nanoid } from 'nanoid'

const STORAGE_KEY = 'padelboard:draftTokens' // { [matchId]: draftToken }

export function generateDraftToken(): string {
  return nanoid(32)
}

export function saveDraftToken(matchId: string, token: string): void {
  if (typeof localStorage === 'undefined') return
  const raw = localStorage.getItem(STORAGE_KEY)
  const map: Record<string, string> = raw ? JSON.parse(raw) : {}
  map[matchId] = token
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function getDraftToken(matchId: string): string | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  const map: Record<string, string> = JSON.parse(raw)
  return map[matchId] ?? null
}

export function clearDraftToken(matchId: string): void {
  if (typeof localStorage === 'undefined') return
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return
  const map: Record<string, string> = JSON.parse(raw)
  delete map[matchId]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}
