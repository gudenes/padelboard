// src/components/overlay/OverlayRenderer.tsx — picks the correct template renderer.
// Legacy matches (template: 'minimal') fall back to the v1 MinimalChip component.
import type { MatchRow } from '@/types/match'
import { getTemplate } from '@/lib/templates/registry'
import { mergeColors } from '@/lib/templates/merge-colors'
import { MinimalChip } from './MinimalChip'

export function OverlayRenderer({ row }: { row: MatchRow }) {
  const template = getTemplate(row.overlay.template)
  if (!template) {
    // Unknown or legacy ('minimal') template — fall back to v1 renderer.
    return <MinimalChip row={row} />
  }
  const colors = mergeColors(template.defaults.colors, row.overlay.customColors)
  const Renderer = template.Renderer
  return <Renderer row={row} colors={colors} />
}
