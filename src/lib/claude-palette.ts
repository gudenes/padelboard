// src/lib/claude-palette.ts — Server-only: call Claude Vision to recommend a palette from a logo URL.
import Anthropic from '@anthropic-ai/sdk'
import { getTemplate } from './templates/registry'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export interface PaletteResult {
  palette: { primary: string; accent: string; textOnPrimary: string; textOnAccent: string }
  slotAssignments: Record<string, Record<string, string>>
  reasoning: string
}

export async function generatePaletteFromLogo(
  logoUrl: string,
  templateId: string,
): Promise<PaletteResult> {
  const template = getTemplate(templateId)
  if (!template) throw new Error(`Unknown template: ${templateId}`)

  const slotDescriptions = template.slots
    .map((s) => `  - "${s.key}" (${s.label}) with fields [${s.fields.join(', ')}]`)
    .join('\n')

  const prompt = `You are a brand design assistant. Analyze the attached tournament logo and recommend a color palette for a padel scoreboard overlay using the "${template.name}" template.

The template exposes these slots:
${slotDescriptions}

Return ONLY valid JSON with this exact shape:
{
  "palette": {
    "primary": "#HEX",
    "accent": "#HEX",
    "textOnPrimary": "#HEX",
    "textOnAccent": "#HEX"
  },
  "slotAssignments": {
    "<slot-key>": { "<field>": "#HEX", ... },
    ...
  },
  "reasoning": "One sentence explaining your choices."
}

Rules:
- All colors must be 7-char hex (#rrggbb) — no alpha.
- textOnPrimary must contrast well with primary (WCAG AA). Same for textOnAccent.
- slotAssignments must cover every slot and every field listed above.
- Reasoning: one sentence, max 25 words.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'url', url: logoUrl } },
        { type: 'text', text: prompt },
      ],
    }],
  })

  const textBlock = response.content.find((c) => c.type === 'text')
  if (!textBlock || textBlock.type !== 'text') throw new Error('No text in response')

  // Pull the JSON block out. Claude sometimes wraps in code fences.
  let json = textBlock.text.trim()
  const fence = json.match(/```(?:json)?\s*([\s\S]+?)```/)
  if (fence) json = fence[1].trim()

  const parsed = JSON.parse(json) as PaletteResult
  if (!parsed.palette || !parsed.slotAssignments || !parsed.reasoning) {
    throw new Error('Invalid palette JSON')
  }
  return parsed
}
