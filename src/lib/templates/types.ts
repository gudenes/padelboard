// src/lib/templates/types.ts — Types for the template system.
import type { MatchRow } from '@/types/match'

export type SlotColors = Record<string, string>

export type TemplateColors = Record<string, SlotColors>

export interface ColorSlot {
  key: string                          // e.g. 'playerRow'
  label: string                        // human label, e.g. 'Player rows'
  fields: Array<'bg' | 'text' | 'color'>  // which keys exist within slot
}

export interface Template {
  id: 'broadcast' | 'classic' | 'premier'
  name: string                         // e.g. 'Broadcast'
  description: string
  defaults: {
    colors: TemplateColors
  }
  slots: ColorSlot[]
  Renderer: React.ComponentType<TemplateRendererProps>
}

export interface TemplateRendererProps {
  row: MatchRow
  colors: TemplateColors               // merged defaults + overrides
}
