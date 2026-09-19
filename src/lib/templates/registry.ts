// src/lib/templates/registry.ts — Lookup + enumeration for the template system.
import { tourTemplates } from './tour'
import { broadcast } from './broadcast'
import { classic } from './classic'
import { premier } from './premier'
import type { Template } from './types'

const REGISTRY: Record<string, Template> = {
  broadcast,
  classic,
  premier,
  ...Object.fromEntries(tourTemplates.map(template => [template.id, template])),
}

export function getTemplate(id: string): Template | null {
  return REGISTRY[id] ?? null
}

export function allTemplates(): Template[] {
  return [...tourTemplates, broadcast, classic, premier]
}
