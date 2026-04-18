// src/lib/templates/merge-colors.ts — Merge a template's default colors with user overrides.
import type { TemplateColors } from './types'

export function mergeColors(
  defaults: TemplateColors,
  overrides: TemplateColors,
): TemplateColors {
  const merged: TemplateColors = {}
  const allKeys = new Set([...Object.keys(defaults), ...Object.keys(overrides)])
  for (const slot of allKeys) {
    merged[slot] = { ...(defaults[slot] ?? {}), ...(overrides[slot] ?? {}) }
  }
  return merged
}
