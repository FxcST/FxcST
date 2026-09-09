import { useEffect } from 'react'
import { Zap } from 'lucide-react'

export default function XpToast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(onDismiss, 3200)
    return () => clearTimeout(timer)
  }, [toast, onDismiss])

  if (!toast) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-20 z-50 mx-auto flex w-fit max-w-[92vw] animate-pop-in items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 backdrop-blur"
    >
      <Zap className="h-4 w-4 text-amber-300" aria-hidden="true" />
      <span className="text-sm font-semibold text-emerald-200">{toast}</span>
    </div>
  )
}
