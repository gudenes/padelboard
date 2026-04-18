// src/components/wizard/WizardFooter.tsx — Back / Continue footer.
'use client'
import { Button } from '@/components/ui/Button'
import type { StepNum } from './useWizardStep'

export function WizardFooter({
  step,
  onBack,
  onNext,
  onPublish,
}: {
  step: StepNum
  onBack: () => void
  onNext: () => void
  onPublish: () => void
}) {
  const isFinal = step === 3
  return (
    <div className="col-span-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] py-3.5 px-9 flex justify-between items-center">
      <span className="text-[12px] text-[var(--color-muted)]">
        {isFinal ? 'All set — click below to publish.' : 'Autosaves as you type.'}
      </span>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={onBack} disabled={step === 1}>
          ← Back
        </Button>
        {isFinal ? (
          <Button onClick={onPublish}>Get my OBS link →</Button>
        ) : (
          <Button onClick={onNext}>Continue →</Button>
        )}
      </div>
    </div>
  )
}
