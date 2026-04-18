// src/components/wizard/StageCourt.tsx — Stylized CSS padel court background for the preview stage.
export function StageCourt({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative aspect-video rounded-xl overflow-hidden shadow-[0_6px_24px_rgba(0,0,0,0.15)]"
      style={{
        background:
          'linear-gradient(180deg, #0a0e14 0%, #1a2432 18%, #24324a 28%, #2c6fb8 38%, #2e7cc8 45%, #286fb8 68%, #1a56a0 85%, #0f3d78 100%)',
      }}
    >
      <div
        className="absolute inset-x-0 top-0 bottom-[65%] pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 10% 50%, rgba(255,255,255,0.08) 0.5px, transparent 1px),
            radial-gradient(circle at 30% 30%, rgba(196,216,46,0.08) 0.5px, transparent 1px),
            radial-gradient(circle at 55% 70%, rgba(255,255,255,0.06) 0.5px, transparent 1px),
            radial-gradient(circle at 80% 40%, rgba(255,200,100,0.08) 0.5px, transparent 1px)
          `,
          backgroundSize: '4px 4px, 5px 5px, 3px 3px, 6px 6px',
        }}
      />
      <div
        className="absolute left-[8%] right-[8%] top-[30%] h-[8%] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.08) 100%)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          borderBottom: '1px solid rgba(0,0,0,0.2)',
        }}
      />
      <div
        className="absolute left-[12%] right-[12%] top-[52%] bottom-[8%] pointer-events-none"
        style={{
          border: '1.5px solid rgba(255,255,255,0.55)',
          borderTopWidth: 2,
          transform: 'perspective(500px) rotateX(52deg)',
          transformOrigin: 'top center',
          background: `
            linear-gradient(90deg, transparent 49%, rgba(255,255,255,0.55) 49%, rgba(255,255,255,0.55) 51%, transparent 51%),
            linear-gradient(180deg, transparent 40%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.55) 41%, transparent 41%)
          `,
        }}
      />
      {children}
    </div>
  )
}
