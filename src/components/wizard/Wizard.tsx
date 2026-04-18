// src/components/wizard/Wizard.tsx — 3-step onboarding wizard shell.
'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import type { MatchRow } from '@/types/match'
import { useDraftMatch } from '@/hooks/useDraftMatch'
import { clearDraftToken, getDraftToken } from '@/lib/draft-token'
import { AuthWallModal } from '@/components/auth/AuthWallModal'
import { WizardRail } from './WizardRail'
import { WizardPreview } from './WizardPreview'
import { WizardFooter } from './WizardFooter'
import { useWizardStep, type StepNum } from './useWizardStep'
import { StepTemplate } from './steps/StepTemplate'
import { StepPlayers } from './steps/StepPlayers'
import { StepFormat } from './steps/StepFormat'

const slideVariants = {
  enter: (dir: 1 | -1) => ({ x: dir * 40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: 1 | -1) => ({ x: dir * -40, opacity: 0 }),
}

export function Wizard({ initial }: { initial: MatchRow }) {
  const { row, patch } = useDraftMatch(initial)
  const { step, direction, setStep } = useWizardStep(row.id)
  const [authOpen, setAuthOpen] = useState(false)
  const params = useSearchParams()
  const completed = new Set<StepNum>()
  if (step > 1) completed.add(1)
  if (step > 2) completed.add(2)

  // Post-magic-link: finalize profile + claim the draft match.
  useEffect(() => {
    if (params.get('complete') !== '1') return
    const raw = localStorage.getItem('padelboard:pendingProfile')
    const matchId = localStorage.getItem('padelboard:claimMatchId')
    if (!raw || !matchId) return
    const { name, role } = JSON.parse(raw)
    const token = getDraftToken(matchId)
    fetch('/api/profile/complete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, role, matchId, draftToken: token }),
    }).then(async (r) => {
      if (r.ok) {
        localStorage.removeItem('padelboard:pendingProfile')
        localStorage.removeItem('padelboard:claimMatchId')
        clearDraftToken(matchId)
        // Force reload so the server re-fetches and routes to the Operator view
        location.href = `/m/${initial.short_code}`
      }
    })
  }, [params, initial.short_code])

  function goBack() { if (step > 1) setStep((step - 1) as StepNum) }
  function goNext() { if (step < 3) setStep((step + 1) as StepNum) }
  function publish() { setAuthOpen(true) }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] p-7">
      <div className="max-w-[1440px] mx-auto">
        <div
          className="grid bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl overflow-hidden shadow-sm"
          style={{ gridTemplateColumns: '240px 1fr 420px' }}
        >
          <WizardRail step={step} completed={completed} onJump={setStep} row={row} />

          <div className="flex flex-col border-r border-[var(--color-border)]">
            <div className="flex-1 p-8 overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ ease: [0.25, 0.1, 0.25, 1], duration: 0.3 }}
                >
                  {step === 1 && <StepTemplate row={row} onChange={patch} />}
                  {step === 2 && <StepPlayers row={row} onChange={patch} />}
                  {step === 3 && <StepFormat row={row} onChange={patch} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <WizardPreview row={row} />

          <WizardFooter step={step} onBack={goBack} onNext={goNext} onPublish={publish} />
        </div>
      </div>
      <AuthWallModal open={authOpen} onClose={() => setAuthOpen(false)} matchId={row.id} />
    </main>
  )
}
