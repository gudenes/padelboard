// src/components/wizard/useWizardStep.ts — Step state with URL and localStorage sync.
'use client'
import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export type StepNum = 1 | 2 | 3

export function useWizardStep(matchId: string): {
  step: StepNum
  direction: 1 | -1
  setStep: (next: StepNum) => void
} {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const initial: StepNum = readStep(params.get('step'), matchId)
  const [step, setStepState] = useState<StepNum>(initial)
  const [direction, setDirection] = useState<1 | -1>(1)

  const setStep = useCallback(
    (next: StepNum) => {
      setDirection(next > step ? 1 : -1)
      setStepState(next)
      try {
        localStorage.setItem(`padelboard:lastStep:${matchId}`, String(next))
      } catch { /* ignore quota */ }
      const usp = new URLSearchParams(params.toString())
      usp.set('step', String(next))
      router.replace(`${pathname}?${usp.toString()}`, { scroll: false })
    },
    [step, pathname, params, router, matchId],
  )

  // Keep state in sync if URL changes from elsewhere (rare)
  useEffect(() => {
    const fromUrl = readStep(params.get('step'), matchId)
    if (fromUrl !== step) {
      setDirection(fromUrl > step ? 1 : -1)
      setStepState(fromUrl)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  return { step, direction, setStep }
}

function readStep(urlValue: string | null, matchId: string): StepNum {
  const fromUrl = urlValue ? parseInt(urlValue, 10) : NaN
  if (fromUrl === 1 || fromUrl === 2 || fromUrl === 3) return fromUrl
  if (typeof localStorage !== 'undefined') {
    const fromStorage = parseInt(localStorage.getItem(`padelboard:lastStep:${matchId}`) ?? '', 10)
    if (fromStorage === 1 || fromStorage === 2 || fromStorage === 3) return fromStorage
  }
  return 1
}
