// src/lib/templates/registry.ts — Lookup + enumeration for the template system.
import { broadcast } from './broadcast'
import { classic } from './classic'
import { premier } from './premier'
import type { Template } from './types'

const REGISTRY: Record<string, Template> = {
  broadcast,
  classic,
  premier,
}

export function getTemplate(id: string): Template | null {
  return REGISTRY[id] ?? null
}

export function allTemplates(): Template[] {
  return [broadcast, classic, premier]
}
